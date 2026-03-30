/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Terminal, 
  Zap, 
  Code2, 
  Play, 
  Cpu, 
  Sparkles, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface VibeAnalysis {
  intent: string;
  confidence: number;
  reasoning: string;
  detectedVariables: string[];
  vibeCheck: "passed" | "ambiguous" | "failed";
}

interface TranspilationResult {
  englishSource: string;
  pythonCode: string;
  javascriptCode: string;
  ast: any;
  analysis: VibeAnalysis;
}

// --- Service ---

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function transpileVibeCode(source: string): Promise<TranspilationResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Transpile the following English code into Python and JavaScript. 
    Act as a Programming Language Theorist. 
    Focus on "VibeCode" philosophy: English is the ultimate syntax.
    
    Source: "${source}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pythonCode: { type: Type.STRING },
          javascriptCode: { type: Type.STRING },
          ast: { 
            type: Type.OBJECT,
            description: "A simplified Abstract Syntax Tree representing the logic."
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              detectedVariables: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              vibeCheck: { 
                type: Type.STRING,
                enum: ["passed", "ambiguous", "failed"]
              }
            },
            required: ["intent", "confidence", "reasoning", "vibeCheck"]
          }
        },
        required: ["pythonCode", "javascriptCode", "ast", "analysis"]
      }
    }
  });

  const result = JSON.parse(response.text);
  return {
    englishSource: source,
    ...result
  };
}

// --- Components ---

const CodeBlock = ({ code, language, title }: { code: string; language: string; title: string }) => (
  <div className="flex flex-col h-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/50">
    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
      <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{title}</span>
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
      </div>
    </div>
    <pre className="p-4 text-sm font-mono text-zinc-300 overflow-auto flex-1">
      <code>{code}</code>
    </pre>
  </div>
);

export default function App() {
  const [input, setInput] = useState("Create a list of numbers from 1 to 10, then filter out the even ones and print their sum.");
  const [isTranspiling, setIsTranspiling] = useState(false);
  const [result, setResult] = useState<TranspilationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'js' | 'py' | 'ast' | 'rules'>('js');

  const handleTranspile = async () => {
    if (!input.trim()) return;
    setIsTranspiling(true);
    setError(null);
    try {
      const res = await transpileVibeCode(input);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError("Failed to resolve the vibe. Semantic ambiguity detected.");
    } finally {
      setIsTranspiling(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">VibeCode <span className="text-orange-500 font-mono text-xs ml-1">v0.1-alpha</span></h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">English-as-a-Language Transpiler</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400 uppercase tracking-wider">
              <a href="#" className="hover:text-white transition-colors">Theology</a>
              <a href="#" className="hover:text-white transition-colors">Spec</a>
              <a href="#" className="hover:text-white transition-colors">Runtime</a>
            </nav>
            <button className="px-4 py-1.5 bg-zinc-100 text-zinc-950 text-xs font-bold rounded hover:bg-white transition-colors uppercase">
              Docs
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Analysis */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <Terminal className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Source Intent</h2>
            </div>
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="State your intent in pure English..."
                className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-lg leading-relaxed focus:outline-none focus:border-orange-500/50 transition-all resize-none placeholder:text-zinc-700 font-serif italic"
              />
              <button
                onClick={handleTranspile}
                disabled={isTranspiling}
                className="absolute bottom-4 right-4 px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 text-white rounded-lg flex items-center gap-2 font-bold transition-all shadow-xl shadow-orange-900/20 group-hover:scale-105 active:scale-95"
              >
                {isTranspiling ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {isTranspiling ? "Resolving..." : "Transpile"}
              </button>
            </div>
          </section>

          {/* Vibe Console */}
          <section className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900/30 overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Vibe Console</span>
              </div>
              {result && (
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter",
                  result.analysis.vibeCheck === 'passed' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                )}>
                  {result.analysis.vibeCheck === 'passed' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  Vibe: {result.analysis.vibeCheck}
                </div>
              )}
            </div>
            
            <div className="p-6 flex-1 font-mono text-xs space-y-4 overflow-auto">
              {!result && !isTranspiling && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center space-y-2">
                  <Sparkles className="w-8 h-8 opacity-20" />
                  <p>Awaiting semantic input...<br/>The vibe is currently neutral.</p>
                </div>
              )}

              {isTranspiling && (
                <div className="space-y-2 animate-pulse">
                  <div className="flex gap-2 text-orange-500/50">
                    <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                    <span>Initializing context-aware parser...</span>
                  </div>
                  <div className="flex gap-2 text-zinc-500">
                    <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                    <span>Scanning for semantic markers...</span>
                  </div>
                  <div className="flex gap-2 text-zinc-500">
                    <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                    <span>Evaluating intent confidence...</span>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-zinc-500 uppercase text-[9px] font-bold">Detected Intent</div>
                    <div className="text-zinc-200 text-sm italic font-serif">"{result.analysis.intent}"</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-zinc-500 uppercase text-[9px] font-bold">Semantic Reasoning</div>
                    <div className="text-zinc-400 leading-relaxed">{result.analysis.reasoning}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-zinc-500 uppercase text-[9px] font-bold">Confidence</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-orange-500 transition-all duration-1000" 
                            style={{ width: `${result.analysis.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-orange-500 font-bold">{(result.analysis.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-zinc-500 uppercase text-[9px] font-bold">Symbols</div>
                      <div className="flex flex-wrap gap-1">
                        {result.analysis.detectedVariables.map(v => (
                          <span key={v} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px]">{v}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <Code2 className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Executable Output</h2>
            </div>
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button 
                onClick={() => setActiveTab('js')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase rounded transition-all",
                  activeTab === 'js' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                JavaScript
              </button>
              <button 
                onClick={() => setActiveTab('py')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase rounded transition-all",
                  activeTab === 'py' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Python
              </button>
              <button 
                onClick={() => setActiveTab('ast')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase rounded transition-all",
                  activeTab === 'ast' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                AST
              </button>
              <button 
                onClick={() => setActiveTab('rules')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase rounded transition-all",
                  activeTab === 'rules' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Rules
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[500px]">
            {!result ? (
              <div className="h-full border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-700 gap-4">
                <div className="p-4 bg-zinc-900 rounded-full">
                  <Code2 className="w-12 h-12 opacity-20" />
                </div>
                <p className="text-sm font-medium">Transpile your intent to see the generated code.</p>
              </div>
            ) : (
              <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'js' && (
                  <CodeBlock title="JavaScript ES2022" language="javascript" code={result.javascriptCode} />
                )}
                {activeTab === 'py' && (
                  <CodeBlock title="Python 3.10" language="python" code={result.pythonCode} />
                )}
                {activeTab === 'ast' && (
                  <CodeBlock title="Vibe AST (JSON)" language="json" code={JSON.stringify(result.ast, null, 2)} />
                )}
                {activeTab === 'rules' && (
                  <div className="flex flex-col h-full border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/50 p-8 space-y-6">
                    <h3 className="text-xl font-serif italic text-orange-500">The VibeCode Axioms</h3>
                    <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
                      <div className="flex gap-4">
                        <span className="text-orange-500 font-mono">01</span>
                        <p><strong className="text-zinc-200">Intent Over Syntax:</strong> The parser prioritizes the "vibe" (semantic goal) over strict keyword matching. If you say "grab", it resolves to "fetch" or "select" based on context.</p>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-orange-500 font-mono">02</span>
                        <p><strong className="text-zinc-200">Contextual Persistence:</strong> Variables are inferred from nouns. "The list" refers to the last mentioned collection. "It" refers to the current iterator item.</p>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-orange-500 font-mono">03</span>
                        <p><strong className="text-zinc-200">Fuzzy Logic Fallback:</strong> When ambiguity exceeds 40%, the engine performs a "vibe check" against common programming patterns (map, filter, reduce, etc.).</p>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-orange-500 font-mono">04</span>
                        <p><strong className="text-zinc-200">Natural Recursion:</strong> "Do this again for each..." is automatically parsed as a recursive or iterative block depending on the data structure depth.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Example Section */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Try these vibes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Calculate Fibonacci up to 20.",
                "Check if a string is a palindrome.",
                "Fetch data from an API and log the titles.",
                "Sort a list of names alphabetically."
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setInput(example)}
                  className="text-left p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-orange-500/30 hover:bg-zinc-800/50 transition-all flex items-center justify-between group"
                >
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 truncate pr-2">{example}</span>
                  <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-orange-500 shrink-0" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
            © 2026 VibeCode Foundation. English is the ultimate syntax.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Semantic Engine Online
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              Latency: 142ms
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
