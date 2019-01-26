import { HydraResource } from 'alcaeus/types/Resources';
import { HydrofoilShell } from '@hydrofoil/hydrofoil-shell/hydrofoil-shell';
declare type Constructor<C> = new (...args: any[]) => HydrofoilShell;
/**
 * A base shell mixin class which uses `Alcaeus` Hydra client to load the resources
 *
 * @mixinFunction
 */
export default function <B extends Constructor<HydrofoilShell>>(Base: B): {
    new (...args: any[]): {
        /**
         * Dispatched when the entrypoint has been loaded
         *
         * @event entrypoint-changed
         */
        /**
         * The Hydra entrypoint linked from the current API Documentation
         */
        entrypoint: HydraResource;
        loadResourceInternal(url: any): Promise<HydraResource>;
    };
} & B;
export {};
