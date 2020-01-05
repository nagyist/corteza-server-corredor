/* eslint-disable @typescript-eslint/ban-ts-ignore */

import { Caster, GenericCaster } from './args'

// @ts-ignore
import ComposeObject from 'corteza-webapp-common/src/lib/types/compose/common'
// @ts-ignore
import Namespace from 'corteza-webapp-common/src/lib/types/compose/namespace'
// @ts-ignore
import Module from 'corteza-webapp-common/src/lib/types/compose/module'
// @ts-ignore
import Record from 'corteza-webapp-common/src/lib/types/compose/record'
// @ts-ignore
import SystemObject from 'corteza-webapp-common/src/lib/types/system/common'
// @ts-ignore
import User from 'corteza-webapp-common/src/lib/types/system/user'
// @ts-ignore
import Role from 'corteza-webapp-common/src/lib/types/system/role'
// @ts-ignore
import MessagingObject from 'corteza-webapp-common/src/lib/types/messaging/common'
// @ts-ignore
import Channel from 'corteza-webapp-common/src/lib/types/messaging/channel'

/**
 * cortezaTypes map helps ExecArgs class with translation of (special) arguments
 * to their respected types
 */
export const cortezaTypes: Caster = new Map()

cortezaTypes.set('authUser', GenericCaster(User))
cortezaTypes.set('invoker', GenericCaster(User))
cortezaTypes.set('module', GenericCaster(Module))
cortezaTypes.set('page', GenericCaster(ComposeObject))
cortezaTypes.set('namespace', GenericCaster(Namespace))
cortezaTypes.set('application', GenericCaster(SystemObject))
cortezaTypes.set('user', GenericCaster(User))
cortezaTypes.set('role', GenericCaster(Role))
cortezaTypes.set('channel', GenericCaster(Channel))
cortezaTypes.set('message', GenericCaster(MessagingObject))

/**
 * Record type caster
 *
 * Record arg is a bit special, it takes 2 params (record itself + record's module)
 */
cortezaTypes.set('record', (val: unknown): Record => {
  return new Record(
    // @ts-ignore
    this.$module,
    val
  )
})