import React, { useState } from 'react';
import { Award, Globe, Lock, Search, ShieldAlert, Wallet } from 'lucide-react';

interface FictionalSite {
  url: string;
  title: string;
  safe: boolean;
  summary: string;
  body: string;
  kind?: 'info' | 'ecz' | 'finance';
}

const LOCAL_EDU_SITES: FictionalSite[] = [
  {
    url: 'edu://zambia-ict.local/home',
    title: 'Zambia ICT Encyclopedia (Simulated Local Site)',
    safe: true,
    summary: 'Educational portal covering computer hardware, software, and school networking.',
    body: 'Welcome to the local educational intranet! This simulated site demonstrates how web browsers request pages using URLs. Notice the protocol (edu://), domain host (zambia-ict.local), and path (/home).',
  },
  {
    url: 'edu://ecz-results.local/verify',
    title: 'ECZ Examination Results Checker (Form 2.4 Simulation)',
    safe: true,
    summary: 'Practise checking simulated Grade 9 / Form 2 / O-Level ECZ results safely offline.',
    body: 'In Form 2 Topic 2.4, learners explore how electronic portals let students check Examinations Council of Zambia (ECZ) results securely without travelling long distances.',
    kind: 'ecz',
  },
  {
    url: 'edu://digital-finance.local/budget',
    title: 'Mobile Money & Personal Budget Tracker (Form 2.4)',
    safe: true,
    summary: 'Compare barter, cash, mobile money wallets, and online banking.',
    body: 'Digital finance tools allow safe school fee payments, airtime purchases, and clear transaction histories. Always verify merchant codes and keep your PIN secret.',
    kind: 'finance',
  },
  {
    url: 'edu://safenet.local/phishing-guide',
    title: 'SafeNet Digital Citizenship & URL Verification',
    safe: true,
    summary: 'Learn how to inspect website addresses before entering any password.',
    body: 'Always read the exact domain name in the address bar. Attackers often create look-alike addresses such as "virtuo1ab-free-prize.example" to trick pupils into sharing passwords.',
  },
];

export const EduBrowserApp: React.FC = () => {
  const [address, setAddress] = useState('edu://zambia-ict.local/home');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSite, setActiveSite] = useState<FictionalSite>(LOCAL_EDU_SITES[0]);
  const [examNumber, setExamNumber] = useState('20260418');
  const [eczResultMsg, setEczResultMsg] = useState('');

  const navigateTo = (url: string) => {
    setAddress(url);
    const matched = LOCAL_EDU_SITES.find((s) => s.url.toLowerCase() === url.trim().toLowerCase());
    if (matched) {
      setActiveSite(matched);
    } else {
      setActiveSite({
        url,
        title: 'Simulated Page Not Found on Local Intranet',
        safe: false,
        summary: 'Local educational sandbox',
        body: 'EduBrowser is an offline educational simulator. It does not connect to the live external Internet. Try selecting one of the fictional educational sites below.',
      });
    }
  };

  const searchResults = LOCAL_EDU_SITES.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white text-slate-900 text-xs">
      {/* Notice Banner */}
      <div className="bg-[#13315C] text-teal-200 px-3 py-1.5 flex items-center justify-between">
        <span className="font-medium">
          Simulated Educational Intranet Browser (Offline Safe Sandbox — No Live Internet)
        </span>
      </div>

      {/* Address Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigateTo(address);
        }}
        className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2"
      >
        {activeSite.safe ? (
          <Lock className="h-4 w-4 text-teal-600 shrink-0" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
        )}
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1 font-mono text-xs"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#13315C] px-3 py-1 font-semibold text-white"
        >
          Go
        </button>
      </form>

      {/* Bookmarks Bar */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-3 py-1.5">
        {LOCAL_EDU_SITES.map((site) => (
          <button
            key={site.url}
            type="button"
            onClick={() => navigateTo(site.url)}
            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 hover:bg-slate-200"
          >
            <Globe className="h-3 w-3 text-blue-700" />
            {site.title.split(' (')[0]}
          </button>
        ))}
      </div>

      {/* Page Body + Simulated Search */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
          <p className="font-mono text-[11px] text-teal-700">{activeSite.url}</p>
          <h3 className="font-display text-lg font-bold text-slate-900">{activeSite.title}</h3>
          <p className="text-sm leading-relaxed text-slate-700">{activeSite.body}</p>

          {activeSite.kind === 'ecz' && (
            <div className="mt-3 rounded-lg border border-slate-300 bg-white p-4 space-y-3">
              <p className="font-semibold flex items-center gap-1.5 text-[#13315C]">
                <Award className="h-4 w-4 text-teal-600" />
                Simulated ECZ Examination Result Lookup
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={examNumber}
                  onChange={(e) => setExamNumber(e.target.value)}
                  placeholder="Enter demo exam number (e.g., 20260418)"
                  className="rounded border border-slate-300 px-3 py-1.5 font-mono"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEczResultMsg(
                      `Candidate ${examNumber || '20260418'} (Demo): Mathematics: Merit · English: Distinction · ICT: Distinction`
                    )
                  }
                  className="rounded bg-teal-600 px-3 py-1.5 font-semibold text-white hover:bg-teal-500"
                >
                  Check Simulated Result
                </button>
              </div>
              {eczResultMsg && (
                <p className="text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded p-2.5">
                  {eczResultMsg}
                </p>
              )}
            </div>
          )}

          {activeSite.kind === 'finance' && (
            <div className="mt-3 rounded-lg border border-slate-300 bg-white p-4 space-y-2">
              <p className="font-semibold flex items-center gap-1.5 text-[#13315C]">
                <Wallet className="h-4 w-4 text-teal-600" />
                Digital Finance Evolution (Form 2.4)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="rounded border border-slate-200 p-2">
                  <p className="font-bold">1. Barter</p>
                  <p className="text-slate-600">Direct goods exchange without digital records.</p>
                </div>
                <div className="rounded border border-slate-200 p-2">
                  <p className="font-bold">2. Physical Cash</p>
                  <p className="text-slate-600">Banknotes &amp; coins carried physically.</p>
                </div>
                <div className="rounded border border-teal-200 bg-teal-50/60 p-2">
                  <p className="font-bold text-teal-900">3. Mobile Money &amp; E-Banking</p>
                  <p className="text-slate-700">Instant digital transfers, receipts &amp; PIN security.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-4">
          <p className="font-semibold text-slate-700 mb-2">Simulated Educational Search Engine</p>
          <div className="relative max-w-md">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search local educational pages (e.g., ECZ, mobile money, phishing)..."
              className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5"
            />
          </div>
          <div className="mt-3 space-y-2">
            {searchResults.map((site) => (
              <button
                key={site.url}
                type="button"
                onClick={() => navigateTo(site.url)}
                className="block w-full text-left rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
              >
                <p className="font-semibold text-blue-700">{site.title}</p>
                <p className="font-mono text-[11px] text-slate-500">{site.url}</p>
                <p className="mt-1 text-slate-600">{site.summary}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
