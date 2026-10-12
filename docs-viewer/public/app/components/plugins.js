export function createPluginManager(plugins) {
  const activePlugins = Array.isArray(plugins) ? plugins.filter(Boolean) : [];

  function runHook(hookName, payload) {
    const errors = [];
    for (const plugin of activePlugins) {
      if (typeof plugin[hookName] !== "function") continue;
      try {
        plugin[hookName](payload);
      } catch (error) {
        errors.push({
          plugin: plugin?.name || "anonymous-plugin",
          hook: hookName,
          message: String(error instanceof Error ? error.message : error)
        });
      }
    }
    return errors;
  }

  return {
    count: activePlugins.length,
    runHook
  };
}
