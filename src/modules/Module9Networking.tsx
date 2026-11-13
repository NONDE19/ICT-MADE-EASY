import React, { useState } from 'react';
import { Cloud, Globe, Network, Router, ShieldCheck, Smartphone, Wifi } from 'lucide-react';
import { EduBrowserApp } from '../simulations/apps/EduBrowserApp.tsx';

const NETWORK_TOPOLOGIES = [
  {
    id: 'pan',
    label: 'PAN (Personal Area Network)',
    range: '~1 – 10 metres',
    media: 'Bluetooth / USB Cable',
    example: 'Connecting a smartphone to wireless earphones or sharing a file to a laptop via Bluetooth/USB tethering.',
  },
  {
    id: 'lan',
    label: 'LAN (Local Area Network)',
    range: 'One classroom or school building',
    media: 'Ethernet (Cat6) / Wi-Fi Router & Switch',
    example: 'Linking 25 classroom computers and a school printer to an ICT Made Easy offline LAN server.',
  },
  {
    id: 'wan',
    label: 'WAN (Wide Area Network)',
    range: 'Cities, provinces & nationwide',
    media: 'Fiber Optic Backbone / Cellular Towers (4G/5G)',
    example: 'Connecting Lusaka, Copperbelt, and rural schools to ECZ examination portals and national cloud systems.',
  },
];

const SHARING_METHODS = [
  {
    id: 'hotspot',
    title: 'Mobile Hotspot (Wi-Fi)',
    detail: 'Turns a smartphone into a portable Wi-Fi router so nearby laptops/tablets share cellular internet or local resources.',
  },
  {
    id: 'bluetooth-tether',
    title: 'Bluetooth Tethering',
    detail: 'Low-power wireless connection for light messaging and syncing one paired device at moderate speeds.',
  },
  {
    id: 'usb-tether',
    title: 'USB Tethering',
    detail: 'Direct USB cable link between phone and PC—fast, secure, and charges the phone simultaneously.',
  },
  {
    id: 'screen-cast',
    title: 'Wireless Screen Casting',
    detail: 'Projects a laptop or tablet display wirelessly to a smart TV or classroom projector over local Wi-Fi.',
  },
];

export const Module9Networking: React.FC = () => {
  const [packetStage, setPacketStage] = useState<'pupil-pc' | 'switch' | 'router' | 'server'>('pupil-pc');
  const [activeTopology, setActiveTopology] = useState<'pan' | 'lan' | 'wan'>('lan');
  const [activeShare, setActiveShare] = useState<string>('hotspot');
  const [urlInput, setUrlInput] = useState('https://school-portal.edu.zm/ict/lessons');

  let parsedUrl = { protocol: 'https:', host: 'school-portal.edu.zm', path: '/ict/lessons' };
  try {
    const u = new URL(urlInput);
    parsedUrl = { protocol: u.protocol, host: u.hostname, path: u.pathname };
  } catch {
    // Keep last valid parse
  }

  const topology = NETWORK_TOPOLOGIES.find((t) => t.id === activeTopology)!;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Network className="h-5 w-5 text-teal-600" />
          Internet &amp; Networking Laboratory (Form 1.4, 4.1 &amp; 4.2)
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Explore PAN, LAN, and WAN networks, Fiber Optic &amp; Wi-Fi transmission, mobile tethering/screen casting, cloud platforms, and safe offline simulated browsing.
        </p>

        {/* Interactive Packet Flow */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { id: 'pupil-pc', title: '1. Classroom Device', sub: 'LAN Client' },
            { id: 'switch', title: '2. Network Switch', sub: 'Connects School LAN' },
            { id: 'router', title: '3. Gateway Router', sub: 'Routes to WAN / Internet' },
            { id: 'server', title: '4. Educational Server', sub: 'Serves Web Pages' },
          ].map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => setPacketStage(node.id as typeof packetStage)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                packetStage === node.id
                  ? 'border-[#13315C] bg-slate-50 dark:border-teal-500 dark:bg-slate-800'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800'
              }`}
            >
              <Router className="h-4 w-4 text-teal-600 mb-2" />
              <p className="text-sm font-semibold">{node.title}</p>
              <p className="text-xs text-slate-500">{node.sub}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          {packetStage === 'pupil-pc' &&
            'Classroom Device: Sends a web page request (HTTP/HTTPS) onto the local school network.'}
          {packetStage === 'switch' &&
            'Network Switch: Links multiple computers and printers inside one classroom or school building to form a Local Area Network (LAN).'}
          {packetStage === 'router' &&
            'Router: Directs data packets between the school’s LAN and external Wide Area Networks (WAN) such as the Internet via Fiber Optic or LTE.'}
          {packetStage === 'server' &&
            'Educational Server: Receives the request and sends back lessons or assessments—either from a local school LAN server without internet or from the cloud.'}
        </div>
      </section>

      {/* Form 4.1: PAN vs LAN vs WAN + Tethering & Casting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <Wifi className="h-4 w-4 text-teal-600" />
            Form 4.1: PAN vs LAN vs WAN Explorer
          </h3>
          <div className="flex flex-wrap gap-2">
            {NETWORK_TOPOLOGIES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTopology(t.id as typeof activeTopology)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  activeTopology === t.id
                    ? 'bg-[#13315C] text-white dark:bg-teal-600'
                    : 'border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {t.id.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5 dark:border-slate-800 dark:bg-slate-950">
            <p className="font-semibold text-sm text-slate-900 dark:text-white">{topology.label}</p>
            <p><strong>Coverage Range:</strong> {topology.range}</p>
            <p><strong>Transmission Media:</strong> {topology.media}</p>
            <p><strong>Zambian School Example:</strong> {topology.example}</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-teal-600" />
            Form 4.1: Tethering, Mobile Hotspot &amp; Screen Casting
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {SHARING_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveShare(m.id)}
                className={`rounded-lg border p-2.5 text-left text-xs font-medium ${
                  activeShare === m.id
                    ? 'border-[#13315C] bg-slate-50 dark:border-teal-500 dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {m.title}
              </button>
            ))}
          </div>
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            {SHARING_METHODS.find((m) => m.id === activeShare)?.detail}
          </p>
        </section>
      </div>

      {/* Form 4.2 Cloud Storage Comparison */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Cloud className="h-4 w-4 text-teal-600" />
          Form 3.2 &amp; 4.2: Cloud Storage Platforms vs Offline Storage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
            <p className="font-semibold text-slate-900 dark:text-white">Google Drive</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              15 GB free storage. Tight integration with Docs/Sheets and real-time multi-user View/Comment/Edit links.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
            <p className="font-semibold text-slate-900 dark:text-white">Microsoft OneDrive</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Built directly into Windows File Explorer with Personal Vault and Word/Excel autosave sync.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
            <p className="font-semibold text-slate-900 dark:text-white">Offline Local + LAN Cache (ICT Made Easy)</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Works with zero internet via IndexedDB &amp; school server sync, ensuring rural and urban parity.
            </p>
          </div>
        </div>
      </section>

      {/* URL Anatomy Inspector */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-700 dark:text-teal-400" />
          URL Anatomy Inspector
        </h3>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-slate-500">Protocol (Rules)</p>
            <p className="mt-1 font-mono font-semibold">{parsedUrl.protocol}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-slate-500">Domain Host (Website)</p>
            <p className="mt-1 font-mono font-semibold">{parsedUrl.host}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <p className="text-slate-500">Resource Path (Page)</p>
            <p className="mt-1 font-mono font-semibold">{parsedUrl.path}</p>
          </div>
        </div>
      </section>

      {/* Embedded Simulated Browser */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          <h3 className="font-display text-base font-semibold">
            Safe Offline Simulated Educational Browser
          </h3>
        </div>
        <div className="h-[420px]">
          <EduBrowserApp />
        </div>
      </section>
    </div>
  );
};
