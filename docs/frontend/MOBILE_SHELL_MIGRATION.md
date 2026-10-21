# Mobile shell modernization

## Scope

The Admin mobile shell now uses the shared mobile presentation layer without changing routes, API calls, feature state, active organization handling, or authorization. `AdminLayout` continues to select exactly one shell from `useViewportShell`; tablet and desktop renderers remain unchanged.

## Changes

- `MobileShell` uses the shared compact `MobileHeader`, with the current route title, a history-aware back action away from the root route, and the Bastak logo.
- `AdminMobileBottomNav` remains driven by `localizedMainNavigationForCapabilities` and `localizedNavigationForCapabilities`. It exposes at most four role-authorized primary destinations plus a More action.
- More opens the existing accessible `ResponsiveDrawer` as a phone navigation sheet. It groups every authorized destination, maintains active-route indication, closes after navigation, and leaves `/admin/more` available as a deep link.
- The bottom dock and page viewport retain safe-area padding. `AdminLayout` continues to synchronize the visual viewport height for virtual-keyboard changes; `SharedPageViewport` remains the primary vertical scroll owner.

## Behavior guarantees

- Role/capability filtering is still decided only by the shared navigation configuration and authentication context.
- No device-specific route, query, API call, or business state was introduced.
- Phone, tablet and desktop use one route tree; changing orientation changes only shell chrome.
- Reduced-performance mode removes the dock backdrop blur while preserving controls and navigation.

## Verification follow-up

Automated coverage checks the compact dock, drawer accessibility, capability filtering and shell selection. Before release, manually exercise narrow and large phones in portrait/landscape, virtual keyboard, 200% zoom, dark mode, RTL/LTR, and every supported active role. Test back navigation from both an in-app route and a directly opened deep link.
