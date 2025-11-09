import { useMemo, memo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useDemographics } from "@/hooks/useAnalyticsData";
import { DemographicsSkeleton } from "./AnalyticsSkeleton";

interface DemographicStats {
  totalMembers: number;
  maleCount: number;
  femaleCount: number;
}

export const Demographics = () => {
  const { data: demographicsData, isLoading } = useDemographics();

  const { genderData, stats, ageData } = useMemo(() => {
    if (!demographicsData || demographicsData.length === 0) {
      return {
        genderData: [],
        stats: { totalMembers: 0, maleCount: 0, femaleCount: 0 },
        ageData: []
      };
    }

    // Calculate total gender counts across all age groups
    const totalMale = demographicsData.reduce((sum, group) => sum + group.maleCount, 0);
    const totalFemale = demographicsData.reduce((sum, group) => sum + group.femaleCount, 0);
    const total = totalMale + totalFemale;

    // Gender chart data
    const genderChartData = [
      { 
        name: 'Male', 
        value: totalMale,
        count: totalMale,
        percentage: `${Math.round((totalMale / total) * 100)}%`
      },
      { 
        name: 'Female', 
        value: totalFemale,
        count: totalFemale,
        percentage: `${Math.round((totalFemale / total) * 100)}%`
      },
    ].filter(item => item.value > 0);

    const statsData = {
      totalMembers: total,
      maleCount: totalMale,
      femaleCount: totalFemale,
    };

    // Age chart data - stacked by gender
    const ageChartData = demographicsData.map(group => ({
      age: group.ageGroup,
      Male: group.maleCount,
      Female: group.femaleCount,
    }));

    return { genderData: genderChartData, stats: statsData, ageData: ageChartData };
  }, [demographicsData]);

  const COLORS = {
    Male: '#6C8BEF',
    Female: '#C68FE6',
  };

  if (isLoading) {
    return <DemographicsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold">Demographics</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
        {/* Gender Distribution - Donut Chart */}
        <div className="bg-[#1E1E1E] rounded-xl p-6 border border-white/10 flex flex-col justify-center items-center min-h-[360px] shadow-lg transition-transform duration-200 hover:scale-[1.02]">
          <div className="mb-4 w-full">
            <h3 className="text-xl font-medium mb-2">Gender Distribution</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Total Members: <span className="font-bold text-white">{stats.totalMembers}</span></span>
            </div>
          </div>
          <div className="flex items-center justify-center w-full" style={{ maxWidth: '280px', aspectRatio: '1/1' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(18, 18, 18)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  itemStyle={{
                    color: '#ffffff'
                  }}
                  labelStyle={{
                    color: '#ffffff'
                  }}
                  formatter={(value: any, name: any, props: any) => [
                    `${value} members (${props.payload.percentage})`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3 w-full">
            {genderData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: Object.values(COLORS)[index] }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{item.count} members</span>
                  <span className="font-bold text-lg">{item.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Age Distribution - Stacked Bar Chart */}
        <div className="bg-[#1E1E1E] rounded-xl p-6 border border-white/10 flex flex-col justify-center min-h-[360px] shadow-lg transition-transform duration-200 hover:scale-[1.02]">
          <h3 className="text-xl font-medium mb-6">Age Distribution</h3>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="age" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(18, 18, 18)', 
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                  itemStyle={{
                    color: '#ffffff'
                  }}
                  labelStyle={{
                    color: '#ffffff'
                  }}
                />
                <Legend 
                  wrapperStyle={{ color: 'white' }}
                  iconType="circle"
                />
                <Bar dataKey="Male" stackId="a" fill={COLORS.Male} />
                <Bar dataKey="Female" stackId="a" fill={COLORS.Female} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6">
            {Object.entries(COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-400">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Source: User Analytics - As of {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default memo(Demographics);
