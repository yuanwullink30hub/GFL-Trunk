import GeneralBrandPage from '@gfl/brands';

/**
 * Marketing app — a standalone showcase of the shared @gfl/brands pages.
 * GeneralBrandPage carries its own nav wheel, so users browse all brands
 * from here. onBack is a no-op (there's no parent section to return to).
 */
export default function App() {
  return (
    <GeneralBrandPage
      isVisible={true}
      onBack={() => {}}
      initialBrandIndex={0}
      hideNavWheel={false}
    />
  );
}
