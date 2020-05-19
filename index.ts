import { HydrofoilShell } from '@hydrofoil/hydrofoil-shell/hydrofoil-shell'
import { HydraResource } from 'alcaeus'
import { HydraClient } from 'alcaeus/alcaeus'
import { property } from 'lit-element'
import notify from './lib/notify'

type ShellConstructor = new (...args: any[]) => HydrofoilShell

interface AlcaeusLoader {

    /**
     * The Hydra entrypoint linked from the current API Documentation
     */
    entrypoints: HydraResource[]

    /**
     * The Hydra client has to be set on the shell instance
     */
    Hydra: HydraClient
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

        @property({ type: Object })
        public entrypoints!: HydraResource[]

        public Hydra!: HydraClient

        protected async loadResourceInternal(url: string) {
            if (!this.Hydra) {
                return null
            }
            return this.Hydra.loadResource(url)
        }

        protected updated(props: Map<string, unknown>) {
            super.updated(props)
            notify(this, props, 'entrypoint')
        }

        protected onResourceLoaded() {
            const entrypoints = this.Hydra.apiDocumentations.reduce((promises, docs) => {
                const { root } = docs
                if (!root || !('loadEntrypoint' in root)) {
                    this._log.warn(`Resource does not appear to be a hydra:ApiDocumentation`)
                    return promises
                }

                promises.push(root.loadEntrypoint()
                    .then(({ representation }) => representation?.root)
                    .catch((e) => {
                        this._log.warn(`Failed to load entrypoint`)
                        this._log.error(e)
                    }))

                return promises
            }, [] as Promise<HydraResource | void | null>[])

            Promise.all(entrypoints).then((resolved) => {
                this.entrypoints = resolved.filter(Boolean) as HydraResource[]
            })
        }
    }

    return Mixin
}
