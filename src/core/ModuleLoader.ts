import { Config } from "./config/Config";
import { config } from "../types/ConfigType";
import { Logger } from "./logger/Logger";
import { Module } from "./Module";
import { ModuleStatus } from "../util/enum/ModuleStatus";

export class ModuleLoader {
	private static readonly _modules: Map<string, Module> = new Map<string, Module>();
	private static readonly _config: config = Config.getConfig();
	private static _disabledModulesAmount: number = 0;

	/**
	 * Loads a module into the module loader.
	 * @param module The module to be loaded.
	 * @returns void
	 * @throws Error if the module is already loaded or if config is missing.
	 */
	public static loadModule(module: Module): void {
		const name = module.name;
		// Prevent loading the same module twice
		if (module.getStatus() === ModuleStatus.STATUS_LOADED) return;
		// Ensure there is at least minimal configuration for this module
		try {
			const result = this.validateModuleConfig(name);
			if (!result) return;
		} catch (err: any) {
			throw new Error(`${err.message} (does ${name} exist in the config?)`);
		}

		module.onLoad();
		module.setTick();
		module.setStatus(ModuleStatus.STATUS_LOADED);
		this._modules.set(name, module);
		Logger.debug(`Module ${name} loaded successfully`);
	}

	/**
	 * Unloads a module from the module loader.
	 * @param module - The module to unload.
	 */
	public static unloadModule(module: Module): void {
		module.onUnload();
		module.removeTick();
		module.setStatus(ModuleStatus.STATUS_UNLOADED);
		Logger.debug(`Module ${module.name} unloaded successfully`);
	}

	/**
	 * Validates the module configuration.
	 * @param name - The name of the module.
	 */
	private static validateModuleConfig(name: string): boolean {
		// Ensure module has configuration set up
		const isValid = this._config.Modules[name].enabled;
		if (!isValid) {
			this._disabledModulesAmount++;
			Logger.debug(`Module ${name} is disabled in the config`);
		}
		return isValid;
	}

	/**
	 * Returns the module with the specified name, if it exists.
	 * @param moduleName The name of the module to retrieve.
	 * @returns The module with the specified name, or undefined if it does not exist.
	 */
	public static getModule(moduleName: string): Module | undefined {
		return this._modules.get(moduleName);
	}

	/**
	 * Returns an array of all loaded modules.
	 * @returns {Module[]} An array of all loaded modules.
	 */
	public static getModules(): Module[] {
		return Array.from(this._modules.values());
	}

	public static getDisabledAmount(): number {
		return this._disabledModulesAmount;
	}
}
