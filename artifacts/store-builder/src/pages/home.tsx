export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Your WhatsApp Store, Ready in Minutes
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          Create a beautiful digital catalog, let customers order seamlessly, and receive everything directly in WhatsApp.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/sign-up"
            className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            Create Your Store
          </a>
          <a href="/sign-in" className="text-sm font-semibold leading-6 text-gray-900">
            Log in <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
