"use client"

import React, { useState } from "react"
import { Building2, Package, Target, ArrowRight } from "lucide-react"


export default function Plans2() {
  const [billingCycle, setBillingCycle] = useState("monthly")

  // Pricing data in a structured format for easy modification
  const plans = [
    {
      id: "beginner",
      title: "Beginner",
      description: "Perfect for small businesses and startups looking to explore AI capabilities.",
      icon: <Package className="w-6 h-6" />,
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        { text: "Basic Predictive Analytics" },
        { text: "Automated Workflows" },
        { text: "Standard Natural Language Processing" },
        { text: "Real-Time Data Analysis" },
        { text: "Basic Customizable Dashboards" },
        { text: "Email Support" },
      ],
    },
    {
      id: "professional",
      title: "Professional",
      description: "Ideal for growing businesses that need more advanced tools to enhance productivity.",
      icon: <Target className="w-6 h-6" />,
      monthlyPrice: 59,
      yearlyPrice: 590,
      features: [
        { text: "Advanced Predictive Analytics" },
        { text: "Automated Workflows" },
        { text: "Enhanced Natural Language " },
        { text: "Real-Time Data Analysis" },
        { text: "Advanced Customizable Dashboards" },
        { text: "Priority Email Support" },
      ],
      highlighted: true,
    },
    {
      id: "enterprise",
      title: "Enterprise",
      description: "Designed for enterprises requiring comprehensive AI solutions.",
      icon: <Building2 className="w-6 h-6" />,
      monthlyPrice: 89,
      yearlyPrice: 890,
      features: [
        { text: "Comprehensive Predictive Analytics" },
        { text: "Automated Workflows" },
        { text: "Premium Natural Language Processing" },
        { text: "Real-Time Data Analysis" },
        { text: "Fully Customizable Dashboards" },
        { text: "24/7 Dedicated Support" },
      ],
    },
  ]

  // Calculate price based on billing cycle
  const getPrice = (plan: { monthlyPrice: number; yearlyPrice: number }) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
  }

  // Apply yearly discount message if applicable
  const getPriceLabel = () => {
    return billingCycle === "monthly" ? "/Per month" : "/Per year"
  }

  return (
    <section className="py-20 px-4 bg-black">
      <div className="max-w-6xl mx-auto">


        <div className="flex justify-between items-end mb-12">
          <h2 className="text-4xl font-bold text-white">Our Pricing Plans</h2>
          <p className="text-base text-gray-400 max-w-md">
            Here are three different plans tailored to Beginner, Professional, and Enterprise levels for your AI
            solution:
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          <div className="bg-neutral-800 rounded-full overflow-hidden p-1 inline-flex">
            <button
              className={`px-4 py-2 text-sm rounded-full ${billingCycle === "monthly" ? "bg-black text-white" : "text-gray-400"}`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-1.5 text-sm rounded-full ${billingCycle === "yearly" ? "bg-black text-white" : "text-gray-400"}`}
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-white">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className=" bg-neutral-900/60 backdrop-blur-xl rounded-[20px] p-2 shadow-[0_0_0_0,inset_0_0_30px_rgba(200,200,200,0.1)] border border-neutral-700"
            >
              <div className="mb-6">
                <div className="flex justify-between items-start mb-3 p-4">
                  <div>
                    <div className="bg-black p-2 rounded-lg inline-block mb-3 ">{plan.icon}</div>
                    <h3 className="text-xl font-bold">{plan.title}</h3>
                  </div>
                  <div className="text-right ">
                    <div className="flex items-baseline justify-end gap-1 ">
                      <span className="text-4xl font-bold text-white ">${getPrice(plan)}</span>
                      <span className="text-sm text-gray-400">{getPriceLabel()}</span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div className="text-xs text-green-400">Save ${plan.monthlyPrice * 2} annually</div>
                    )}
                  </div>
                </div>
                <p className="p-4 text-sm text-gray-400">{plan.description}</p>
              </div>
              <div className="bg-neutral-900/60 backdrop-blur-xl rounded-[20px] p-6 shadow-[0_0_0_0,inset_0_0_30px_rgba(200,200,200,0.1)] border border-neutral-700">
                <button
                  className={`w-full text-sm cursor-pointer ${
                    plan.highlighted 
                      ? "bg-white text-black hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.45)] group" 
                      : "bg-black text-white hover:bg-neutral-800 duration-300 group"
                  } py-3 rounded-lg mb-6 transition-all flex items-center justify-center gap-2`}
                >
                  Get Started <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <div>
                  <p className="text-2xl font-semibold mb-4">Features:</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-1.5">
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M10 3L4.5 8.5L2 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span className="text-base text-gray-400">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}