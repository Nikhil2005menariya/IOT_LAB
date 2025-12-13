import Navbar from "../components/Navbar";

export default function Landing() {
  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 text-neutral-800">
              IoT Lab Inventory Management System
            </h2>

            <p className="text-neutralSoft-600 mb-6 leading-relaxed">
              A centralized system to manage borrowing, returning, and
              inventory tracking of IoT lab components with intelligent
              analytics for admins.
            </p>

            <div className="flex gap-4">
              <a
                href="/login?role=system"
                className="px-6 py-3 rounded-md bg-brand-500 text-white font-medium hover:bg-brand-600"
              >
                System Login
              </a>

              <a
                href="/login?role=admin"
                className="px-6 py-3 rounded-md border font-medium hover:bg-neutralSoft-100"
              >
                Admin Login
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="h-64 w-full rounded-xl bg-neutralSoft-100 flex items-center justify-center text-neutralSoft-500">
              Dashboard Preview
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
