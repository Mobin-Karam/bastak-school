export function hasCapability(capabilities: readonly string[], capability: string) {
  return capabilities.includes(capability);
}

export function hasAnyCapability(capabilities: readonly string[], required: readonly string[]) {
  return required.some((capability) => hasCapability(capabilities, capability));
}

export function hasAllCapabilities(capabilities: readonly string[], required: readonly string[]) {
  return required.every((capability) => hasCapability(capabilities, capability));
}
