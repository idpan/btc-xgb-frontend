import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Network,
  ChevronDown,
  Search,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import TreeViewer from "./TreeViewer";
import { bertanda } from "../utils/calculation";

export default function DecisionTree({
  pohon = [],
  judulHalaman = "Visualisasi Pohon Keputusan",
  customHeader = null,
  onSelectTree: externalOnSelectTree,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dropdownRef = useRef(null);

  // Baca id pohon dari URL query string (default: 1)
  const queryTreeId = parseInt(searchParams.get("treeId") || "1", 10);
  const [selectedTreeId, setSelectedTreeId] = useState(
    isNaN(queryTreeId) ? 1 : queryTreeId,
  );

  // Sinkronkan state lokal saat query param atau data pohon berubah
  useEffect(() => {
    if (
      pohon.length > 0 &&
      !isNaN(queryTreeId) &&
      queryTreeId >= 1 &&
      queryTreeId <= pohon.length
    ) {
      setSelectedTreeId(queryTreeId);
    } else if (
      pohon.length > 0 &&
      (selectedTreeId > pohon.length || selectedTreeId < 1)
    ) {
      setSelectedTreeId(1);
    }
  }, [queryTreeId, pohon.length, selectedTreeId]);

  // Handle klik di luar dropdown untuk menutup popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsGridOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTree = (id) => {
    setSelectedTreeId(id);
    setSearchParams({ treeId: String(id) });
    setIsGridOpen(false);
    setSearchQuery("");
    if (externalOnSelectTree) {
      externalOnSelectTree(id);
    }
  };

  const handleJumpSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(searchQuery, 10);
    if (!isNaN(num) && num >= 1 && num <= pohon.length) {
      handleSelectTree(num);
    }
  };

  const currentTree = useMemo(
    () => pohon.find((p) => p.id === selectedTreeId) || pohon[0],
    [pohon, selectedTreeId],
  );

  // Filter grid berdasarkan input pencarian cepat
  const filteredPohon = useMemo(() => {
    if (!searchQuery.trim()) return pohon;
    return pohon.filter((p) => String(p.id).includes(searchQuery.trim()));
  }, [pohon, searchQuery]);

  return (
    <div
      className={`mx-auto w-full text-slate-800 transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-900 p-2 overflow-hidden flex flex-col"
          : "max-w-[90rem] p-4"
      }`}
    >
      {/* Top Header Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
          isFullscreen
            ? "border-slate-800 text-slate-100 mb-2 px-2"
            : "border-slate-200 mb-4"
        }`}
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Network
                className={`w-5 h-5 ${
                  isFullscreen ? "text-indigo-400" : "text-indigo-600"
                }`}
              />{" "}
              {judulHalaman}
            </h1>
            {!isFullscreen && (
              <p className="text-xs text-slate-500 mt-0.5">
                Gunakan selector dropdown untuk melompat langsung ke nomor
                pohon.
              </p>
            )}
          </div>
          {customHeader && <div className="mt-2 sm:mt-0">{customHeader}</div>}
        </div>

        {/* Floating / Embedded Controls Bar */}
        <div className="flex items-center gap-3">
          {/* Dropdown Selector Button (Anchor) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsGridOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm transition-all ${
                isFullscreen
                  ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>
                Pohon{" "}
                <strong className="text-indigo-500">#{selectedTreeId}</strong>{" "}
                / {pohon.length}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isGridOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Popover Grid (10 Kolom x 10 Baris) */}
            {isGridOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-3 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                {/* Search / Jump Input Field */}
                <form
                  onSubmit={handleJumpSubmit}
                  className="relative mb-3 flex items-center"
                >
                  <Search className="w-4 h-4 absolute left-2.5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max={pohon.length}
                    placeholder={`Ketik nomor (1-${pohon.length})...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-1 px-2 py-1 bg-indigo-600 text-white text-[10px] font-semibold rounded hover:bg-indigo-700"
                  >
                    Go
                  </button>
                </form>

                {/* Grid 10 Kolom */}
                <div className="max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {filteredPohon.map((p) => {
                      const isSelected = p.id === selectedTreeId;
                      const isPositive = p.leafScore >= 0;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelectTree(p.id)}
                          title={`Pohon #${p.id} | Score: ${bertanda(
                            p.leafScore,
                          )}`}
                          className={`relative flex flex-col items-center justify-center h-9 rounded-md text-xs font-mono font-medium transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400 font-bold"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <span>{p.id}</span>
                          {/* Dot Indikator Leaf Score (Hijau/Merah) */}
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              isSelected
                                ? "bg-white"
                                : isPositive
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {filteredPohon.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      Pohon tidak ditemukan.
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                      +Score
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />{" "}
                      -Score
                    </span>
                  </div>
                  <span>Total: {pohon.length} Pohon</span>
                </div>
              </div>
            )}
          </div>

          {/* Active Tree Status Summary */}
          {currentTree && (
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                isFullscreen
                  ? "bg-slate-800 text-slate-300"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              <span>
                Leaf:{" "}
                <strong className="font-mono text-indigo-400">
                  #{currentTree.leafId}
                </strong>
              </span>
              <span className="opacity-30">|</span>
              <span>
                Score:{" "}
                <strong
                  className={
                    currentTree.leafScore >= 0
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }
                >
                  {bertanda(currentTree.leafScore)}
                </strong>
              </span>
            </div>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? "Keluar Fullscreen" : "Layar Penuh"}
            className={`p-1.5 rounded-lg border shadow-sm transition-all ${
              isFullscreen
                ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Display Area: Full Screen Viewport untuk TreeViewer */}
      <div
        className={`w-full rounded-xl transition-all ${
          isFullscreen
            ? "flex-1 bg-slate-950 p-1 border border-slate-800"
            : "bg-white border border-slate-200 p-2 shadow-sm"
        }`}
      >
        {currentTree ? (
          <TreeViewer
            treeIndex={currentTree.id - 1}
            leafId={currentTree.leafId}
            height={isFullscreen ? "100%" : "80vh"}
          />
        ) : (
          <div className="flex items-center justify-center h-[70vh] text-slate-400 text-sm">
            Pilih pohon untuk menampilkan visualisasi.
          </div>
        )}
      </div>
    </div>
  );
}
