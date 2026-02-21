import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Coin } from "@/types/coin";

interface StatisticsPanelProps {
  coins: Coin[];
}

const COLORS = {
  inCollection: "#10b981", // emerald-500
  sold: "#ef4444", // red-500
  listed: "#3b82f6", // blue-500
};

export function StatisticsPanel({ coins }: StatisticsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate statistics
  const yearDistribution = coins.reduce((acc, coin) => {
    const year = coin.year.toString();
    if (!acc[year]) {
      acc[year] = { year, count: 0 };
    }
    acc[year].count++;
    return acc;
  }, {} as Record<string, { year: string; count: number }>);

  const yearData = Object.values(yearDistribution).sort((a, b) => 
    parseInt(a.year) - parseInt(b.year)
  );

  // Status breakdown
  const statusData = [
    { 
      name: "In Collection", 
      value: coins.filter(c => !c.isSold && !c.listingId).length,
      color: COLORS.inCollection
    },
    { 
      name: "Sold", 
      value: coins.filter(c => c.isSold).length,
      color: COLORS.sold
    },
    { 
      name: "Listed", 
      value: coins.filter(c => c.listingId && !c.isSold).length,
      color: COLORS.listed
    },
  ].filter(item => item.value > 0);

  // Purchase price trends over time
  const priceData = coins
    .filter(c => c.purchaseDate && c.purchasePrice)
    .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime())
    .map(coin => ({
      date: new Date(coin.purchaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      price: coin.purchasePrice,
    }));

  // Grade distribution
  const gradeDistribution = coins.reduce((acc, coin) => {
    const grade = coin.sheldonGrade || "Unknown";
    if (!acc[grade]) {
      acc[grade] = { grade, count: 0 };
    }
    acc[grade].count++;
    return acc;
  }, {} as Record<string, { grade: string; count: number }>);

  const gradeData = Object.values(gradeDistribution).sort((a, b) => b.count - a.count);

  return (
    <Card className="bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="text-2xl text-slate-900 dark:text-white">Collection Analytics</CardTitle>
        <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Year Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Distribution by Year</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={yearData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Purchase Price Trends */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Purchase Price Trends</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Grade Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Grade Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="grade" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}