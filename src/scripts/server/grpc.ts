/* eslint-disable @typescript-eslint/ban-ts-ignore */

import grpc from 'grpc'
import pino from 'pino'
import { HandleException } from '+grpc-server'
import { Service, ExecArgsRaw, GRPCServiceExecResponse, GRPCServiceListResponse, ScriptSecurity } from '.'

interface KV {
  [_: string]: string;
}

interface ListRequest {
    query?: string;
    resource?: string;
    events?: string[];
    security?: number;
}

interface ExecRequest {
  name: string;
  args?: KV;
}
/**
 * Decodes exec arguments
 *
 * It assumes values of all properties in the
 * passed object are strings with encoded JSON
 *
 * @param {object} args
 * @returns {object} parsed arguments
 */
export function decodeExecArguments (args: KV|undefined): ExecArgsRaw {
  if (!args) {
    return {}
  }

  for (const k in args) {
    if (!Object.prototype.hasOwnProperty.call(args, k)) {
      continue
    }

    try {
      args[k] = JSON.parse(args[k])
    } catch (e) {
      throw new Error(`Could not parse argument ${k}: ${e}`)
    }
  }

  return args
}

export function encodeExecResult (args: object): KV {
  const enc: KV = {}

  for (const k in args) {
    if (!Object.prototype.hasOwnProperty.call(args, k)) {
      continue
    }

    // @ts-ignore
    enc[k] = JSON.stringify(args[k])
  }

  return enc
}

export function Handlers (h: Service, loggerService: pino.BaseLogger): object {
  return {
    Exec ({ request }: { request: ExecRequest }, done: grpc.sendUnaryData<GRPCServiceExecResponse|null>): void {
      const started = Date.now()
      const { name, args } = request
      const logger = loggerService.child({ rpc: 'Exec', script: name })

      try {
        // Decode arguments
        // passed in as keys with JSON-encoded values
        const dArgs = decodeExecArguments(args)

        logger.debug({ args }, 'executing script %s', name)
        h.Exec(name, dArgs).then(({ result, log }) => {
          const meta = new grpc.Metadata()

          // Map each log line from the executed function to the metadata
          log.forEach((l: string) => {
            logger.debug(`${name} emitted log: ${l}`)
            meta.add('log', l)
          })

          done(null, { result: encodeExecResult(result) }, meta)
          logger.debug({
            duration: Date.now() - started
          }, 'done')
        }).catch(e => {
          logger.debug({ stack: e.stack }, e.message)
          HandleException(e, done)
        })
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done)
      }
    },

    List ({ request }: { request: ListRequest }, done: grpc.sendUnaryData<GRPCServiceListResponse|null>): void {
      const grpcSecDefiner = 1
      const { query, resource, events, security } = request
      const logger = loggerService.child({ rpc: 'List' })

      const filter = {
        query,
        resource,
        events,

        // translate protobuf's enum
        security: security === grpcSecDefiner
          ? ScriptSecurity.definer
          : ScriptSecurity.invoker
      }

      logger.debug({ filter }, 'returning list of scripts')

      try {
        const scripts = h.List(filter)
        done(null, { scripts })
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done)
      }
    }
  }
}