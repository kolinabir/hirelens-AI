"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeMsg, setSubscribeMsg] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = subscribeEmail.trim();
    if (!email) return;

    setIsSubscribing(true);
    setSubscribeMsg("🔄 Subscribing...");

    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (json.success) {
        setSubscribeMsg(
          `🎉 Successfully subscribed! ${
            json.data?.welcomeSent
              ? `Welcome email sent with ${json.data.sentCount} job opportunities.`
              : "You'll receive job updates soon."
          }`
        );
        setSubscribeEmail("");
      } else {
        setSubscribeMsg(
          `❌ Failed to subscribe: ${json.error || "Unknown error"}`
        );
      }
    } catch (err: unknown) {
      setSubscribeMsg(
        `❌ Failed to subscribe: ${(err as Error)?.message || "Network error"}`
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white backdrop-blur-lg shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl shadow-md overflow-hidden">
                <img
                  src="/hirelensLogo.png"
                  alt="HireLens Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-2xl font-bold text-blue-600">
                  HireLens
                </span>
                <div className="text-xs text-gray-500 font-medium">
                  AI Job Discovery
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
                <a
                  href="#features"
                  className="hover:text-blue-600 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#stats"
                  className="hover:text-blue-600 transition-colors"
                >
                  Stats
                </a>
                <a
                  href="#subscribe"
                  className="hover:text-blue-600 transition-colors"
                >
                  Subscribe
                </a>
              </div>
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 bg-white overflow-hidden mt-12">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gray-50/30"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-50/20 transform skew-x-12 translate-x-1/4"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="max-w-2xl">
              {/* Status Badge */}
              <div className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <span>🚀 AI-Powered • Trusted by 500+ job seekers</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Find Your Dream Job
                <span className=" text-blue-600"> 10x Faster</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Stop wasting hours scrolling through Facebook groups. HireLens
                uses AI to automatically find, analyze, and organize job
                opportunities that match your skills.
              </p>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Instant Job Alerts
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    AI-Filtered
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Real-time
                  </span>
                </div>
              </div>

              {/* Email Subscription Form */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Get Job Alerts in Your Inbox
                  </h3>
                  <p className="text-sm text-gray-600">
                    Be the first to know about new opportunities
                  </p>
                </div>

                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      required
                      disabled={isSubscribing}
                    />
                    <button
                      type="submit"
                      disabled={isSubscribing || !subscribeEmail.trim()}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSubscribing ? (
                        <div className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Subscribing...
                        </div>
                      ) : (
                        "Subscribe Free"
                      )}
                    </button>
                  </div>

                  {subscribeMsg && (
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        subscribeMsg.includes("Success") ||
                        subscribeMsg.includes("🎉")
                          ? "bg-green-50 border border-green-200 text-green-800"
                          : subscribeMsg.includes("❌")
                          ? "bg-red-50 border border-red-200 text-red-800"
                          : "bg-blue-50 border border-blue-200 text-blue-800"
                      }`}
                    >
                      <p className="font-medium text-center">{subscribeMsg}</p>
                    </div>
                  )}
                </form>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-600">
                  <span className="flex items-center">
                    <svg
                      className="w-3 h-3 mr-1 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Free forever
                  </span>
                  <span className="flex items-center">
                    <svg
                      className="w-3 h-3 mr-1 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    No spam
                  </span>
                  <span className="flex items-center">
                    <svg
                      className="w-3 h-3 mr-1 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Unsubscribe anytime
                  </span>
                </div>
              </div>

              {/* CTA Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Start Free Today
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Browse Jobs Now
                  </Link>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  No signup required • View 1000+ jobs • 2-minute setup
                </p>
              </div>
            </div>

            {/* Right Column - Visual/Demo */}
            <div className="relative lg:ml-8">
              {/* Main Dashboard Preview */}
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="ml-4 text-sm text-gray-600 font-medium">
                      HireLens Dashboard
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {/* Mock Job Cards */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            Senior React Developer
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            TechCorp • Remote • $80k-120k
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              React
                            </span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              TypeScript
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">2h ago</div>
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            Product Manager
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            StartupXYZ • San Francisco • $90k-130k
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              Strategy
                            </span>
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              Analytics
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">4h ago</div>
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            UX Designer
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            DesignStudio • New York • $70k-100k
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                              Figma
                            </span>
                            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                              Research
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">6h ago</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Found 847 jobs today
                      </span>
                      <div className="flex items-center text-green-600">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium">98% match rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg">
                ✨ AI Powered
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-semibold shadow-lg">
                🚀 Real-time
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              Platform Features
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose HireLens?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our AI-powered platform revolutionizes job hunting by
              intelligently analyzing thousands of opportunities and presenting
              only the most relevant matches for your career goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-8 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                AI-Powered Extraction
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI automatically extracts job details,
                requirements, and application methods from Facebook posts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-8 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Smart Organization
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Jobs are automatically categorized, filtered, and organized with
                professional layouts for easy browsing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-8 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Real-time Updates
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get instant notifications about new job opportunities matching
                your preferences and skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Trusted by Job Seekers Worldwide
            </h2>
            <p className="text-xl text-blue-100">
              Real numbers from our growing community
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-blue-100">Jobs Analyzed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-blue-100">Facebook Groups</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-blue-100">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Email Subscription CTA Section */}
      <section id="subscribe" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-12">
            <div className="w-full h-1 bg-blue-600 rounded-full mb-8"></div>

            <div className="inline-flex items-center bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Get Job Alerts
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Never Miss Your Dream Job Again
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Subscribe to receive AI-curated job opportunities directly in your
              inbox. Get notified about the latest positions from Facebook
              groups, professionally organized and ready to apply.
            </p>

            {/* Email Subscription Form */}
            <form onSubmit={handleSubscribe} className="max-w-md mx-auto mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="email"
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg"
                    required
                    disabled={isSubscribing}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubscribing || !subscribeEmail.trim()}
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 whitespace-nowrap"
                >
                  {isSubscribing ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Subscribing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Subscribe Free
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Subscription Message */}
            {subscribeMsg && (
              <div
                className={`p-4 rounded-xl mb-6 ${
                  subscribeMsg.includes("Successfully") ||
                  subscribeMsg.includes("🎉")
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : subscribeMsg.includes("❌")
                    ? "bg-red-50 border border-red-200 text-red-800"
                    : "bg-blue-50 border border-blue-200 text-blue-800"
                }`}
              >
                <p className="font-medium">{subscribeMsg}</p>
              </div>
            )}

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Instant Notifications
                  </h4>
                  <p className="text-sm text-gray-600">
                    Get alerts as soon as new jobs match your profile
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    AI-Curated
                  </h4>
                  <p className="text-sm text-gray-600">
                    Only quality opportunities, filtered by our AI
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Privacy First
                  </h4>
                  <p className="text-sm text-gray-600">
                    Your email is safe and you can unsubscribe anytime
                  </p>
                </div>
              </div>
            </div>

            {/* Alternative CTA */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-4">Or explore jobs right now</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center bg-gray-100 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Browse Jobs
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-2xl font-bold">HireLens</span>
                  <div className="text-sm text-gray-400">
                    AI Job Discovery Platform
                  </div>
                </div>
              </div>
              <p className="text-gray-400 max-w-md leading-relaxed">
                Revolutionizing job discovery through AI-powered analysis of
                Facebook group opportunities. Find your dream job with
                intelligent matching and professional presentation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#stats"
                    className="hover:text-white transition-colors"
                  >
                    Statistics
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#subscribe"
                    className="hover:text-white transition-colors"
                  >
                    Subscribe
                  </a>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="hover:text-white transition-colors cursor-pointer">
                    Terms of Service
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 mb-4 md:mb-0">
                © 2024 HireLens. All rights reserved. Built with ❤️ for job
                seekers worldwide.
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  System Status: Operational
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
