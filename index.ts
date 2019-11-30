import { HydrofoilShell } from '@hydrofoil/hydrofoil-shell/hydrofoil-shell'
import { HydraResource } from 'alcaeus/types/Resources'
import { IHydraResponse } from 'alcaeus/types/HydraResponse'
import { property } from 'lit-element'
import notify from './lib/notify'

function checkId(value, old) {
    return !old || old.id !== value.id
}

type ShellConstructor = new (...args: any[]) => HydrofoilShell

interface AlcaeusLoader {

    /**
     * The Hydra entrypoint linked from the current API Documentation
     */
    entrypoint: HydraResource
}

type ReturnConstructor = new (...args: any[]) => HydrofoilShell & AlcaeusLoader

/**
 * A base shell mixin class which uses `Alcaeus` Hydra client to load the resources
 *
 * @mixinFunction
 */
export default function<B extends ShellConstructor> (Base: B): B & ReturnConstructor {
    class Mixin extends Base implements AlcaeusLoader {
        /**
         * Dispatched when the entrypoint has been loaded
         *
         * @event entrypoint-changed
         */

        @property({ type: Object, hasChanged: checkId })
        public entrypoint: HydraResource

        protected async loadResourceInternal(url) {
            return import('alcaeus').then(({ Hydra }) => Hydra.loadResource(url))
        }

        protected updated(props) {
            super.updated(props)
            notify(this, props, 'entrypoint')
        }

        protected onResourceLoaded(response: IHydraResponse) {
            if (!(response && response.root)) {
                return
            }
            const resource = response.root

            resource.apiDocumentation && resource.apiDocumentation.do({
                just: (apiDocumentation) => {
                    apiDocumentation.loadEntrypoint()
                        .then((entrypoint) => {
                            this.entrypoint = entrypoint.root
                        })
                        .catch((e) => {
                            this._log.warn(`Failed to load entrypoint`)
                            this._log.error(e)
                        })
                },
            })
        }
    }

    return Mixin
}
