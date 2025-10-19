import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface UserDemo {
  gender: string;
  birthdate: string | null;
}

export const Demographics = () => {
  const [timeFilter, setTimeFilter] = useState<"7days" | "28days" | "alltime">("7days");
  const [genderData, setGenderData] = useState<{ name: string; value: number; percentage: string }[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);

  useEffect(() => {
    fetchDemographics();

    // Real-time updates
    const channel = supabase
      .channel('demographics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles'
        },
        () => {
          fetchDemographics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeFilter]);

  const fetchDemographics = async () => {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('gender, birthdate');

    if (profiles) {
      // Calculate gender distribution
      const genderCounts = {
        male: 0,
        female: 0,
        other: 0,
        'prefer_not_to_say': 0
      };

      profiles.forEach(profile => {
        const gender = profile.gender || 'prefer_not_to_say';
        if (gender in genderCounts) {
          genderCounts[gender as keyof typeof genderCounts]++;
        }
      });

      const total = profiles.length;
      const genderChartData = [
        { 
          name: 'Male', 
          value: genderCounts.male,
          percentage: `${Math.round((genderCounts.male / total) * 100)}%`
        },
        { 
          name: 'Female', 
          value: genderCounts.female,
          percentage: `${Math.round((genderCounts.female / total) * 100)}%`
        },
        { 
          name: 'Not Specified', 
          value: genderCounts.prefer_not_to_say + genderCounts.other,
          percentage: `${Math.round(((genderCounts.prefer_not_to_say + genderCounts.other) / total) * 100)}%`
        },
      ].filter(item => item.value > 0);

      setGenderData(genderChartData);

      // Calculate age distribution
      const ageGroups = {
        '0-17': { male: 0, female: 0, other: 0 },
        '18-24': { male: 0, female: 0, other: 0 },
        '25-34': { male: 0, female: 0, other: 0 },
        '35-44': { male: 0, female: 0, other: 0 },
        '45-54': { male: 0, female: 0, other: 0 },
        '55-64': { male: 0, female: 0, other: 0 },
        '65+': { male: 0, female: 0, other: 0 },
      };

      profiles.forEach(profile => {
        if (profile.birthdate) {
          const age = calculateAge(profile.birthdate);
          const ageGroup = getAgeGroup(age);
          const gender = profile.gender === 'male' ? 'male' : 
                        profile.gender === 'female' ? 'female' : 'other';
          
          if (ageGroup in ageGroups) {
            ageGroups[ageGroup as keyof typeof ageGroups][gender]++;
          }
        }
      });

      const ageChartData = Object.entries(ageGroups).map(([age, counts]) => ({
        age,
        Male: counts.male,
        Female: counts.female,
        'Not Specified': counts.other,
      }));

      setAgeData(ageChartData);
    }
  };

  const calculateAge = (birthdate: string): number => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getAgeGroup = (age: number): string => {
    if (age < 18) return '0-17';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  };

  const COLORS = {
    Male: '#6B7280',
    Female: '#9CA3AF',
    'Not Specified': '#D1D5DB',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold">Demographics</h2>
      </div>

      <div className="flex gap-6 border-b border-gray-800 pb-4">
        <button
          onClick={() => setTimeFilter("7days")}
          className={`text-sm font-semibold pb-2 transition-colors ${
            timeFilter === "7days" 
              ? "text-white border-b-2 border-white" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          7 DAYS
        </button>
        <button
          onClick={() => setTimeFilter("28days")}
          className={`text-sm font-semibold pb-2 transition-colors ${
            timeFilter === "28days" 
              ? "text-white border-b-2 border-white" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          28 DAYS
        </button>
        <button
          onClick={() => setTimeFilter("alltime")}
          className={`text-sm font-semibold pb-2 transition-colors ${
            timeFilter === "alltime" 
              ? "text-white border-b-2 border-white" 
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          ALL TIME
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Gender Distribution - Donut Chart */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-6">Gender Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry) => `${entry.name}: ${entry.percentage}`}
                  labelLine={false}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgb(18, 18, 18)', 
                    border: '1px solid rgb(59, 130, 246)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-2">
            {genderData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: Object.values(COLORS)[index] }}
                  />
                  <span className="text-sm text-gray-300">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{item.percentage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Age Distribution - Stacked Bar Chart */}
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-6">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="age" 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgb(18, 18, 18)', 
                  border: '1px solid rgb(59, 130, 246)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend 
                wrapperStyle={{ color: 'white' }}
                iconType="circle"
              />
              <Bar dataKey="Male" stackId="a" fill={COLORS.Male} />
              <Bar dataKey="Female" stackId="a" fill={COLORS.Female} />
              <Bar dataKey="Not Specified" stackId="a" fill={COLORS['Not Specified']} />
            </BarChart>
          </ResponsiveContainer>
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
