"use client";

import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IChartDataPoint } from '@/api/dashboard-api'; // Adım 79 (API)
import { formatDate } from '@/lib/utils'; // Adım 64 (lib)
import { useTheme } from '../providers/theme-provider'; // Adım 77 (Provider)

/**
 * SalesChart (Satış Grafiği) Bileşeni
 *
 * 'DashboardOverviewPage' (Ana Dashboard) üzerinde,
 * API'den gelen 'salesReport' verisini (zaman serisi)
 * görselleştirmek için 'Recharts' kütüphanesini kullanır.
 *
 * 'AreaChart' (Alan Grafiği) olarak render edilir.
 */

interface SalesChartProps {
  data: IChartDataPoint[];
}

export const SalesChart = ({ data }: SalesChartProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme(); // Temayı al (light/dark)

  // Recharts'ın temaya (light/dark) göre kullanacağı
  // renkleri (stroke, fill) belirle.
  // Bu renkler 'globals.css' (Adım 63) içindeki
  // 'foreground' ve 'primary' CSS değişkenlerine
  // dayanmalıdır (HSL formatında).
  const isDarkMode = document.documentElement.classList.contains('dark');
  const colors = {
    text: isDarkMode ? 'hsl(210 40% 98%)' : 'hsl(222.2 84% 4.9%)', // foreground
    primaryFill: 'hsl(262.1 83.3% 57.8%)', // primary
  };

  // 1. Veri Yoksa (No Data)
  if (!data || data.length === 0) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>{t('dashboard.sales_report')}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">{t('generics.no_data')}</p>
        </CardContent>
      </Card>
    );
  }

  // 2. Veri Varsa (Grafiği Render Et)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.sales_report')}</CardTitle>
        {/* Opsiyonel: Buraya Tarih Aralığı Seçici (DateRangePicker)
            eklenebilir (v2). */}
      </CardHeader>
      <CardContent className="h-[350px] w-full pr-6 pt-4">
        {/* 'ResponsiveContainer', grafiğin 'Card'
            bileşenine tam olarak sığmasını sağlar.
        */}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: -20, // YAxis etiketlerine yer aç
              bottom: 0,
            }}
          >
            {/* Arka plan ızgarası (Grid) */}
            <CartesianGrid
              strokeDasharray="3 3"
              strokeOpacity={0.2}
              stroke={colors.text}
            />

            {/* X Ekseni (Tarihler) */}
            <XAxis
              dataKey="date" // API'den gelen { date: "...", value: ... }
              stroke={colors.text}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              // Tarihleri formatla (örn. "2024-10-25" -> "25.10.2024")
              tickFormatter={(str) => formatDate(str, 'short')}
            />

            {/* Y Ekseni (Satış Miktarı) */}
            <YAxis
              stroke={colors.text}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              // Değerleri formatla (örn. 1500 -> "₺1.5k")
              tickFormatter={(value) =>
                `₺${(value / 1000).toFixed(0)}k`
              }
            />

            {/* Tooltip (Grafik üzerine gelince çıkan bilgi kutusu) */}
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode
                  ? 'hsl(222.2 84% 4.9%)' // background
                  : 'hsl(0 0% 100%)', // background
                borderColor: 'hsl(217.2 32.6% 17.5%)', // border
                borderRadius: '0.5rem', // --radius
              }}
              // Tooltip'teki etiketi (label) formatla
              labelFormatter={(label) => formatDate(label, 'long')}
              // Tooltip'teki değeri (value) formatla
              formatter={(value: number) => [
                `₺${value.toFixed(2)}`, // TODO: Para birimi
                'Satış', // Değerin adı
              ]}
            />

            {/* Alan (Area) Grafiği */}
            <Area
              type="monotone" // Yumuşak (eğimli) çizgi
              dataKey="value" // API'den gelen { ..., value: 1500 }
              stackId="1"
              stroke={colors.primaryFill} // Çizgi rengi (Primary)
              fill={colors.primaryFill} // Alan dolgu rengi (Primary)
              fillOpacity={0.2} // Dolgu opaklığı
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};