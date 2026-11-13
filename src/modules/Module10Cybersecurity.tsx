import React, { useState } from 'react';
import { CheckCircle2, KeyRound, MailWarning, ShieldAlert, ShieldCheck } from 'lucide-react';

const PHISHING_TESTS = [
  {
    id: 'msg1',
    sender: 'support@virtuo1ab-free-airtime.example',
    subject: 'URGENT: Verify your school password in 10 minutes or lose account!',
    body: 'Click http://virtuo1ab-login-check.example/reset and send your school password to claim free data.',
    isPhishing: true,
    reason: 'Look-alike domain ("virtuo1ab" with number 1), artificial urgency, and asking for your password.',
  },
  {
    id: 'msg2',
    sender: 'teacher.mwamba@virtuolab.edu.zm',
    subject: 'Grade 8A ICT Practical Deadline Reminder',
    body: 'Remember to submit your Assignments folder task inside the ICT Made Easy Practical Assessment Centre by Friday.',
    isPhishing: false,
    reason: 'Legitimate school domain (.edu.zm), normal academic reminder, and does not ask for your password.',
  },
];

const SAFETY_SCENARIOS = [
  {
    id: 'sc1',
    prompt: 'A classmate receives hurtful messages in a school chat group and asks you what to do.',
    options: [
      'Share the hurtful messages further to get more views',
      'Do not reply to provoke, save screenshots as evidence, block/report, and inform a trusted teacher or parent',
      'Delete your own school account immediately without telling anyone',
    ],
    correct: 1,
    explanation: 'Saving evidence, avoiding retaliation, and reporting to a trusted adult or teacher stops cyberbullying safely.',
  },
  {
    id: 'sc2',
    prompt: 'A pop-up website offers a "Free Speed Booster.exe" download while you are researching science homework.',
    options: [
      'Download and run the unknown .exe file right away',
      'Close the pop-up without downloading—unknown executables often carry viruses or malware',
      'Disable your antivirus software so it installs faster',
    ],
    correct: 1,
    explanation: 'Unsolicited executable downloads are a common malware and computer virus delivery method.',
  },
];

const SIMULATED_SCAN_FILES = [
  { id: 'f1', name: 'Term1_Maths_Notes.vdoc', threatType: 'Clean', risk: 'Safe', description: 'Standard educational text document.' },
  { id: 'f2', name: 'Free_Exam_Answers.exe', threatType: 'Trojan Horse', risk: 'Infected', description: 'Disguises itself as helpful software to steal saved passwords.' },
  { id: 'f3', name: 'Autorun_USB_Spread.vbs', threatType: 'Worm', risk: 'Infected', description: 'Replicates itself across school lab USB flash drives automatically.' },
  { id: 'f4', name: 'Keystroke_Monitor.dll', threatType: 'Spyware', risk: 'Infected', description: 'Secretly records typed usernames and PINs in the background.' },
  { id: 'f5', name: 'Macro_Corrupt_Doc.docm', threatType: 'Computer Virus', risk: 'Infected', description: 'Attaches malicious macro code to host documents.' },
];

const MEDIA_STATEMENTS = [
  {
    id: 'm1',
    text: 'Zambia’s Form 1–4 Ordinary Level ICT Syllabus introduces computer hardware in Form 1 and file encryption in Form 2.',
    expected: 'Fact',
    why: 'Verifiable directly from the Ministry of Education syllabus document.',
  },
  {
    id: 'm2',
    text: 'Spreadsheets are the most exciting application ever invented because calculating marks is fun.',
    expected: 'Opinion',
    why: 'Expresses a personal feeling or value judgment ("most exciting", "fun").',
  },
  {
    id: 'm3',
    text: 'Only expensive laptops can help students learn ICT—school desktops and offline tablets are a waste of time.',
    expected: 'Bias',
    why: 'One-sided claim ignoring how offline simulations and lab desktops effectively build practical skills.',
  },
];

export const Module10Cybersecurity: React.FC = () => {
  const [passwordInput, setPasswordInput] = useState('Lusaka');
  const [phishingPicks, setPhishingPicks] = useState<Record<string, boolean>>({});
  const [scenarioPicks, setScenarioPicks] = useState<Record<string, number>>({});
  const [scanComplete, setScanComplete] = useState(false);
  const [quarantinedIds, setQuarantinedIds] = useState<string[]>([]);
  const [mediaPicks, setMediaPicks] = useState<Record<string, string>>({});

  const hasLength = passwordInput.length >= 10;
  const hasUpper = /[A-Z]/.test(passwordInput);
  const hasLower = /[a-z]/.test(passwordInput);
  const hasDigit = /\d/.test(passwordInput);
  const hasSymbol = /[^A-Za-z0-9]/.test(passwordInput);
  const score = [hasLength, hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;

  const strengthLabel =
    score <= 2 ? 'Weak — Easy to guess' : score <= 4 ? 'Moderate — Improve length/symbols' : 'Strong Password';

  return (
    <div className="space-y-6">
      {/* Password Strength Analyzer */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-teal-600" />
          Password Security Tester (Safe Local Simulation)
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Test how length, uppercase, numbers, and symbols strengthen a passphrase. (Never enter a real banking password here.)
        </p>

        <div className="mt-4 max-w-lg space-y-3">
          <input
            type="text"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
            placeholder="Try typing a strong passphrase..."
          />
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-2 rounded-full transition-all ${
                score <= 2 ? 'bg-red-500' : score <= 4 ? 'bg-amber-500' : 'bg-teal-600'
              }`}
              style={{ width: `${(score / 5) * 100}%` }}
            />
          </div>
          <p className="text-xs font-semibold">{strengthLabel}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span>{hasLength ? '✓' : '○'} 10+ characters</span>
            <span>{hasUpper ? '✓' : '○'} Uppercase letter</span>
            <span>{hasLower ? '✓' : '○'} Lowercase letter</span>
            <span>{hasDigit ? '✓' : '○'} Number (0-9)</span>
            <span>{hasSymbol ? '✓' : '○'} Special symbol (!@#)</span>
          </div>
        </div>
      </section>

      {/* Form 3.4 & 4.3 Antivirus Malware Scanner Simulator */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
              <ShieldAlert className="h-4 w-4 text-teal-600" />
              Form 3.4 &amp; 4.3: Antivirus &amp; Malware Scanner Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Scan a simulated USB Drive to identify and quarantine Viruses, Worms, Trojans, and Spyware.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScanComplete(true)}
            className="rounded-lg bg-[#13315C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B437D] dark:bg-teal-600"
          >
            Run Simulated USB Scan
          </button>
        </div>

        {scanComplete && (
          <div className="space-y-2">
            {SIMULATED_SCAN_FILES.map((item) => {
              const isQuarantined = quarantinedIds.includes(item.id);
              const isThreat = item.risk === 'Infected';
              return (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800"
                >
                  <div>
                    <p className="font-mono font-semibold text-slate-900 dark:text-white">
                      {item.name}{' '}
                      <span
                        className={`ml-2 ${
                          !isThreat || isQuarantined ? 'text-teal-600' : 'text-red-600'
                        }`}
                      >
                        [{isQuarantined ? 'Quarantined' : item.threatType}]
                      </span>
                    </p>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300">{item.description}</p>
                  </div>
                  {isThreat && !isQuarantined && (
                    <button
                      type="button"
                      onClick={() => setQuarantinedIds((prev) => [...prev, item.id])}
                      className="rounded-lg bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-500"
                    >
                      Quarantine
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Phishing Email Spotter */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <MailWarning className="h-4 w-4 text-amber-600" />
          Phishing Detection Lab
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PHISHING_TESTS.map((msg) => {
            const pick = phishingPicks[msg.id];
            const answered = pick !== undefined;
            const correct = pick === msg.isPhishing;
            return (
              <div key={msg.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 space-y-3">
                <div className="text-xs">
                  <p className="font-mono text-slate-500">From: {msg.sender}</p>
                  <p className="mt-1 font-semibold text-sm text-slate-900 dark:text-white">
                    {msg.subject}
                  </p>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{msg.body}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhishingPicks((p) => ({ ...p, [msg.id]: true }))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-red-600" /> Mark as Phishing
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhishingPicks((p) => ({ ...p, [msg.id]: false }))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> Legitimate Message
                  </button>
                </div>
                {answered && (
                  <p className={`text-xs font-medium ${correct ? 'text-teal-700 dark:text-teal-400' : 'text-red-600'}`}>
                    {correct ? 'Correct: ' : 'Look Closer: '}
                    {msg.reason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Form 4.4 Digital Citizenship: Fact vs Opinion vs Bias */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
          Form 4.4: Digital Citizenship — Fact vs Opinion vs Bias
        </h3>
        <div className="space-y-3">
          {MEDIA_STATEMENTS.map((st) => {
            const pick = mediaPicks[st.id];
            return (
              <div key={st.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 space-y-2">
                <p className="text-sm font-medium text-slate-900 dark:text-white">&ldquo;{st.text}&rdquo;</p>
                <div className="flex flex-wrap gap-2">
                  {['Fact', 'Opinion', 'Bias'].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setMediaPicks((p) => ({ ...p, [st.id]: choice }))}
                      className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                        pick === choice
                          ? 'border-[#13315C] bg-[#13315C] text-white dark:border-teal-500 dark:bg-teal-600'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                {pick && (
                  <p className={`text-xs font-medium ${pick === st.expected ? 'text-teal-700 dark:text-teal-400' : 'text-red-600'}`}>
                    {pick === st.expected ? 'Correct: ' : `This is ${st.expected}: `}
                    {st.why}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Malware, Privacy & Cyberbullying Scenarios */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-600" />
          Digital Safety &amp; Privacy Scenarios
        </h3>
        {SAFETY_SCENARIOS.map((sc) => {
          const picked = scenarioPicks[sc.id];
          return (
            <div key={sc.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm font-medium">{sc.prompt}</p>
              <div className="mt-3 space-y-2">
                {sc.options.map((opt, idx) => (
                  <label key={opt} className="flex items-center gap-2.5 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name={sc.id}
                      checked={picked === idx}
                      onChange={() => setScenarioPicks((p) => ({ ...p, [sc.id]: idx }))}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              {picked !== undefined && (
                <p
                  className={`mt-3 text-xs font-medium ${
                    picked === sc.correct ? 'text-teal-700 dark:text-teal-400' : 'text-red-600'
                  }`}
                >
                  {picked === sc.correct ? 'Best Choice: ' : 'Safety Tip: '}
                  {sc.explanation}
                </p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};
