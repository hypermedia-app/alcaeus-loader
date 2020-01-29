import { HydrofoilShell } from '@hydrofoil/hydrofoil-shell/hydrofoil-shell'
import { HydraResource } from 'alcaeus/types/Resources'
import { HydraClient } from 'alcaeus/types/alcaeus'
import { property } from 'lit-element'
import notify from './lib/notify'

type ShellConstructor = new (...args: any[]) => HydrofoilShell

interface AlcaeusLoader {

    /**
     * The Hydra entrypoint linked from the current API Documentation
     */
    entrypoints: HydraResource[]
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

        public __alcaeus!: HydraClient

        protected async loadResourceInternal(url: string) {
            if (!this.__alcaeus) {
                this.__alcaeus = (await import('alcaeus')).default
            }
            return this.__alcaeus.loadResource(url)
        }

        protected updated(props: Map<string, unknown>) {
            super.updated(props)
            notify(this, props, 'entrypoint')
        }

        protected onResourceLoaded() {
            this.__alcaeus.apiDocumentations
                .then((documentations) => {
                    const entrypoints = documentations.reduce((promises, docs) => {
                        promises.push(docs.loadEntrypoint()
                            .then(entrypoint => entrypoint.root)
                            .catch((e) => {
                                this._log.warn(`Failed to load entrypoint`)
                                this._log.error(e)
                            }))

                        return promises
                    }, [] as Promise<HydraResource | void | null>[])

                    return Promise.all(entrypoints)
                })
                .then((entrypoints) => {
                    this.entrypoints = entrypoints.filter(e => !!e) as HydraResource[]
                })
        }
    }

    return Mixin
}
