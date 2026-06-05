import { SignalSlashIcon } from '@heroicons/react/24/outline';

export function OfflineBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-zinc-800 text-white text-sm px-4 py-2.5 flex items-center gap-2 justify-center"
      role="alert"
      aria-live="assertive"
    >
      <SignalSlashIcon className="w-4 h-4 flex-shrink-0" />
      You are offline — email actions require a connection
    </div>
  );
}
