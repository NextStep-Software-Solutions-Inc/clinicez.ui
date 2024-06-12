export default function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-primary"></div>
      <span className="mt-5 text-lg font-semibold">
        Page Loading...
      </span>
    </div>
  );
}
