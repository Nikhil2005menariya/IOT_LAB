import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Loader from "../components/Loader";
import { fetchBorrowers, fetchBorrowerDetails } from "../api";

export default function Borrowers() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch borrowers list
  const { data: borrowers = [], isLoading } = useQuery({
    queryKey: ["borrowers", query],
    queryFn: () => fetchBorrowers(query),
  });

  // Load borrower details + sessions
  const loadDetails = async (student) => {
    try {
      setLoadingDetails(true);
      const res = await fetchBorrowerDetails(student._id);
      setSelected(res);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6">Borrowers</h1>

        {/* Search */}
        <input
          className="border px-4 py-2 rounded-md w-80 mb-6"
          placeholder="Search by registration number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Borrowers list */}
          <div className="border rounded-md overflow-hidden">
            {isLoading ? (
              <div className="p-6">
                <Loader />
              </div>
            ) : borrowers.length === 0 ? (
              <div className="p-6 text-sm text-neutralSoft-500">
                No borrowers found
              </div>
            ) : (
              borrowers.map((b) => (
                <div
                  key={b._id}
                  onClick={() => loadDetails(b)}
                  className="px-4 py-3 border-b cursor-pointer hover:bg-neutralSoft-100"
                >
                  <div className="font-medium">{b.reg_no}</div>
                  <div className="text-xs text-neutralSoft-500">
                    {b.name || "No name"} • {b.department || "N/A"}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Borrower details */}
          <div className="border rounded-md p-4 min-h-[300px]">
            {!selected ? (
              <p className="text-sm text-neutralSoft-500">
                Select a borrower to view details
              </p>
            ) : loadingDetails ? (
              <Loader />
            ) : (
              <>
                {/* Student info */}
                <h2 className="text-lg font-semibold mb-1">
                  {selected.student.reg_no}
                </h2>

                <p className="text-sm text-neutralSoft-600">
                  {selected.student.name || "—"} •{" "}
                  {selected.student.department || "—"}
                </p>

                <p className="text-xs text-neutralSoft-500 mb-4">
                  {selected.student.email || ""}{" "}
                  {selected.student.phone || ""}
                </p>

                {/* Sessions */}
                {selected.sessions.length === 0 ? (
                  <p className="text-sm text-neutralSoft-500">
                    No borrowing history
                  </p>
                ) : (
                  selected.sessions.map((s) => (
                    <div
                      key={s._id}
                      className="border-t pt-3 mt-3 text-sm"
                    >
                      <div className="flex justify-between">
                        <span>
                          Status:{" "}
                          <strong className="capitalize">{s.status}</strong>
                        </span>
                        <span className="text-xs text-neutralSoft-500">
                          {new Date(s.borrowed_at).toLocaleString()}
                        </span>
                      </div>

                      <ul className="mt-2 ml-4 list-disc">
                        {s.items.map((i, idx) => (
                          <li key={idx}>
                            {i.name} — {i.qty}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
