import React, { useEffect, useState } from 'react';
import { Camera, ImagePlus, Info, Trash2 } from 'lucide-react';
import { getCachedJson, setCachedJson } from '../services/offlineDb.ts';

export interface EquipmentPhotoSlot {
  id: string;
  name: string;
  category: string;
  syllabusRef: string;
  description: string;
  suggestedFilename: string;
}

export const EQUIPMENT_PHOTO_SLOTS: EquipmentPhotoSlot[] = [
  {
    id: 'mouse',
    name: 'Computer Mouse',
    category: 'Input Device',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Pointing device with left/right buttons and scroll wheel used to move the cursor and select icons.',
    suggestedFilename: 'mouse.jpg',
  },
  {
    id: 'keyboard',
    name: 'Computer Keyboard',
    category: 'Input Device',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'QWERTY alphanumeric keys, function keys (F1–F12), and shortcuts (Ctrl+C, Ctrl+V) for entering text.',
    suggestedFilename: 'keyboard.jpg',
  },
  {
    id: 'monitor',
    name: 'Monitor (Visual Display Unit)',
    category: 'Output Device',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Displays the computer desktop, documents, spreadsheets, and interactive lessons to the learner.',
    suggestedFilename: 'monitor.jpg',
  },
  {
    id: 'system-unit',
    name: 'Desktop System Unit & Power Button',
    category: 'Processing Chassis',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Protective tower case housing the power button, USB ports, motherboard, PSU, and internal drives.',
    suggestedFilename: 'system-unit.jpg',
  },
  {
    id: 'cpu',
    name: 'Central Processing Unit (CPU)',
    category: 'Processing',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Microprocessor chip executing program instructions and arithmetic/logic operations.',
    suggestedFilename: 'cpu.jpg',
  },
  {
    id: 'motherboard',
    name: 'Motherboard',
    category: 'Internal Circuitry',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Main printed circuit board connecting the CPU, RAM slots, BIOS ROM, storage, and expansion ports.',
    suggestedFilename: 'motherboard.jpg',
  },
  {
    id: 'ram',
    name: 'RAM Memory Module',
    category: 'Primary Memory',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Volatile DIMM stick holding active operating system and application data while powered on.',
    suggestedFilename: 'ram.jpg',
  },
  {
    id: 'ssd-hdd',
    name: 'SSD / Hard Disk Drive',
    category: 'Secondary Storage',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Non-volatile storage keeping the Operating System and school files safe after shutdown.',
    suggestedFilename: 'ssd-hdd.jpg',
  },
  {
    id: 'printer',
    name: 'Printer',
    category: 'Output Device',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Produces physical paper hard copies of essays, exam papers, flyers, and mark sheets.',
    suggestedFilename: 'printer.jpg',
  },
  {
    id: 'scanner',
    name: 'Document Scanner',
    category: 'Input Device',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Digitizes paper forms, photographs, and printed notes into image or PDF files.',
    suggestedFilename: 'scanner.jpg',
  },
  {
    id: 'usb-flash',
    name: 'USB Flash Drive',
    category: 'Portable Storage',
    syllabusRef: 'Form 1 · Topic 1.3',
    description: 'Removable flash stick (Drive E:) used for backing up schoolwork and transferring files offline.',
    suggestedFilename: 'usb-flash.jpg',
  },
  {
    id: 'router-switch',
    name: 'Wi-Fi Router & Network Switch',
    category: 'Networking',
    syllabusRef: 'Form 4 · Topic 4.1',
    description: 'Connects lab computers into a LAN and bridges school networks to Fiber or mobile WAN links.',
    suggestedFilename: 'router-switch.jpg',
  },
  {
    id: 'air-blower',
    name: 'Industrial Air Blower',
    category: 'Hardware Care',
    syllabusRef: 'Form 1 · Topic 1.2.1',
    description: 'Safely clears dust from heatsinks, cooling fans, and vents inside the computer lab.',
    suggestedFilename: 'air-blower.jpg',
  },
];

const PHOTO_CACHE_KEY = 'equipmentPhotos:v1';

async function readAndResizePhoto(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  if (typeof Image === 'undefined') return dataUrl;

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Image decode failed'));
      el.src = dataUrl;
    });
    const maxWidth = 900;
    if (img.width <= maxWidth) return dataUrl;
    const scale = maxWidth / img.width;
    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.84);
  } catch {
    return dataUrl;
  }
}

export const RealEquipmentPhotos: React.FC = () => {
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, string>>({});
  const [missingStatic, setMissingStatic] = useState<Record<string, boolean>>({});
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let active = true;
    getCachedJson<Record<string, string>>(PHOTO_CACHE_KEY)
      .then((cached) => {
        if (active && cached) setUploadedPhotos(cached);
      })
      .catch(() => {
        // Ignore IndexedDB availability issues in test environments
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUploadPhoto = async (slotId: string, label: string, file?: File) => {
    if (!file) return;
    try {
      const optimized = await readAndResizePhoto(file);
      const next = { ...uploadedPhotos, [slotId]: optimized };
      setUploadedPhotos(next);
      try {
        await setCachedJson(PHOTO_CACHE_KEY, next);
      } catch {
        // Keep in-memory copy even if storage quota is constrained
      }
      setStatusMessage(`Saved real photo for "${label}" offline.`);
    } catch {
      setStatusMessage(`Could not read photo file for "${label}".`);
    }
  };

  const handleRemovePhoto = async (slotId: string, label: string) => {
    const next = { ...uploadedPhotos };
    delete next[slotId];
    setUploadedPhotos(next);
    try {
      await setCachedJson(PHOTO_CACHE_KEY, next);
    } catch {
      // Ignore storage error
    }
    setStatusMessage(`Removed custom photo for "${label}".`);
  };

  const loadedCount = EQUIPMENT_PHOTO_SLOTS.filter(
    (slot) => Boolean(uploadedPhotos[slot.id]) || !missingStatic[slot.id]
  ).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-5">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-teal-600" />
            Real Equipment Photo Showcase (Offline Ready)
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Real photographs of a mouse, keyboard, monitor, CPU, printer, scanner, and other syllabus hardware help learners recognize actual lab equipment. Attach real photos from your device below (stored locally for 100% offline use), or place image files inside <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-slate-800">public/equipment/</code>.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200 shrink-0">
          {loadedCount}/{EQUIPMENT_PHOTO_SLOTS.length} photos ready
        </span>
      </div>

      <div className="rounded-lg border border-sky-200 bg-sky-50/70 px-4 py-3 text-xs text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <span>
          External Google Images links are intentionally not hotlinked so every lesson continues working in schools with zero internet connection. Upload real photos here or share them directly to bundle into the app.
        </span>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2 text-xs font-medium text-teal-800 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EQUIPMENT_PHOTO_SLOTS.map((slot) => {
          const uploadedSrc = uploadedPhotos[slot.id];
          const staticSrc = `/equipment/${slot.suggestedFilename}`;
          const hasStatic = !missingStatic[slot.id];
          const activeSrc = uploadedSrc || (hasStatic ? staticSrc : '');

          return (
            <div
              key={slot.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden flex flex-col dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div className="h-44 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-center relative overflow-hidden">
                {activeSrc ? (
                  <img
                    src={activeSrc}
                    alt={`${slot.name} real hardware photo`}
                    onError={() => {
                      if (!uploadedSrc) {
                        setMissingStatic((prev) => ({ ...prev, [slot.id]: true }));
                      }
                    }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="p-4 text-center space-y-1.5">
                    <Camera className="h-7 w-7 mx-auto text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Real Photo Slot: {slot.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500">
                      public/equipment/{slot.suggestedFilename}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <p className="text-[11px] font-medium text-teal-700 dark:text-teal-400">
                    {slot.syllabusRef} · {slot.category}
                  </p>
                  <h4 className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                    {slot.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {slot.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#13315C] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1B437D] cursor-pointer dark:bg-teal-600 dark:hover:bg-teal-500">
                    <ImagePlus className="h-3.5 w-3.5" />
                    <span>{uploadedSrc ? 'Replace Photo' : 'Attach Real Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        handleUploadPhoto(slot.id, slot.name, file);
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>

                  {uploadedSrc && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(slot.id, slot.name)}
                      className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      title="Remove custom photo"
                      aria-label={`Remove photo for ${slot.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
