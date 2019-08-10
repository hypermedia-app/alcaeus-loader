import { HydrofoilShell } from '@hydrofoil/hydrofoil-shell/hydrofoil-shell'
import { HydraResource } from 'alcaeus/types/Resources'
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

        public connectedCallback() {
            super.connectedCallback()
            this.addEventListener('model-changed', () => {
                if (this.model && this.model.apiDocumentation) {
                    this.model.apiDocumentation.do({
                        just: (apiDocumentation) => {
                            apiDocumentation.loadEntrypoint()
                                .then((entrypoint) => {
                                    this.entrypoint = entrypoint.root
                                })
                                .catch(() => {
                                    console.error('failed to load entrypoint')
                                })
                        },
                    })
                }
            })
        }

        protected async loadResourceInternal(url) {
            const alcaeus = await import('alcaeus')
            const hr = await alcaeus.Hydra.loadResource(url)
            return hr.root
        }

        protected updated(props) {
            super.updated(props)
            notify(this, props, 'entrypoint')
        }
    }

    return Mixin
}
