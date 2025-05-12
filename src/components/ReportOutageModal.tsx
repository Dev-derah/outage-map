"use client";
import { useState } from "react";

export default function ReportOutageModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg"
      >
        Report Outage
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md">
            <h2 className="text-xl font-bold mb-4">Report an Outage</h2>
            <form>
              <label className="block mb-2">
                Type:
                <select className="w-full border p-2 rounded mt-1">
                  <option>Power</option>
                  <option>Internet</option>
                  <option>Water</option>
                </select>
              </label>
              <label className="block mb-2">
                Description:
                <textarea className="w-full border p-2 rounded mt-1" rows={3} />
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
