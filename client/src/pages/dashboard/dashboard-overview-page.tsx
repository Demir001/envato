"use client";

import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  Users,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Archive,
} from 'lucide-react';
import { useAuthStore, selectUser } from '@/store/use-auth-store';
import { useGetDashboardData } from '@/api/dashboard-api'; // Adım 79'da oluşturuldu

import FullPageSpinner, { Spinner } from '@/components/ui/full-page-spinner';
import { KpiCard } from '@/components/dashboard/kpi-card'; // Adım 109'da oluşturulacak
import { SalesChart } from '@/components/dashboard/sales-chart'; // Adım 110'da oluşturulacak
import { RecentAppointmentsCard } from '@/components/dashboard/recent-appointments-card'; // Adım 111'de oluşturulacak
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Adım 91'de oluşturuldu

/**
 * DashboardOverviewPage (Ana Gösterge Paneli)
 *
 * '/' veya '/dashboard' rotasında, 'DashboardLayout' içinde 'Outlet'
 * aracılığıyla render edilir.
 *
 * Sorumlulukları:
 * 1. 'useGetDashboardData' (React Query) kancası ile tüm
 * KPI ve grafik verilerini çekmek.
 * 2. Veri yüklenirken (isLoading) bir yükleme göstergesi (Spinner) göstermek.
 * 3. Hata durumunda (isError) bir hata mesajı göstermek.
 * 4. Veri başarıyla çekildiğinde, alt bileşenlere (KpiCard, SalesChart)
 * bu verileri 'prop' olarak geçerek sayfayı oluşturmak.
 */
const DashboardOverviewPage = () => {
  const { t } = useTranslation();
  // 'user' nesnesini al (örn. "Hoş geldiniz, Ahmet!")
  const user = useAuthStore(selectUser);

  // 1. Dashboard verisini çekmek için React Query kancasını kullan
  // (Varsayılan olarak son 30 günü çeker)
  const {
    data: dashboardDataResponse,
    isLoading,
    isError,
    error,
  } = useGetDashboardData();

  // 2. Yükleme (Loading) Durumu
  // (useQuery 'isLoading' iken 'dashboardDataResponse' 'undefined' olur)
  if (isLoading) {
    // Sayfa iskeleti (skeleton) yerine basit bir spinner göster
    return (
      <div className="flex h-[calc(100vh-8rem)] w-full items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  // 3. Hata (Error) Durumu
  if (isError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-destructive">
          {t('generics.error_message')}: {error?.message}
        </p>
      </div>
    );
  }

  // 4. Başarı Durumu (Veri mevcut)
  // 'dashboardDataResponse', API'den dönen tam yanıttır
  // (içinde success, message, data bulunur).
  // Asıl veriler 'dashboardData.data' içindedir.
  const dashboardData = dashboardDataResponse?.data;
  if (!dashboardData) {
    return <div>{t('generics.no_data')}</div>;
  }

  const { kpis, salesReport, recentAppointments, recentPatients } =
    dashboardData;

  return (
    <>
      {/* Sayfa başlığını (HTML <title>) dinamik olarak ayarla */}
      <Helmet>
        <title>{t('sidebar.dashboard')} - ClinicAdmin</title>
      </Helmet>

      <div className="flex flex-col gap-8">
        {/* 1. Başlık (Welcome Mesajı) */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('dashboard.welcome', { name: user?.name || 'Kullanıcı' })}
          </p>
        </div>

        {/* 2. KPI Kartları (Grid) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* 'KpiCard' (Adım 109) bileşenine verileri 'prop' olarak geç */}
          <KpiCard
            title={t('dashboard.total_patients')}
            value={kpis.totalPatients.toString()}
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
            description="" // Opsiyonel: "+5.2% vs last month"
          />
          <KpiCard
            title={t('dashboard.upcoming_appts')}
            value={kpis.upcomingAppointments.toString()}
            icon={<CalendarClock className="h-5 w-5 text-muted-foreground" />}
            description="Önümüzdeki 7 gün"
          />
          <KpiCard
            title={t('dashboard.today_sales')}
            value={t('generics.currency_symbol', { // TODO: Para birimi
              val: kpis.todaySales,
            })}
            icon={
              <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
            }
          />
          <KpiCard
            title={t('dashboard.pending_invoices')}
            value={kpis.pendingInvoices.toString()}
            icon={<ClipboardList className="h-5 w-5 text-muted-foreground" />}
          />
          <KpiCard
            title={t('dashboard.low_stock')}
            value={kpis.lowStockItems.toString()}
            icon={<Archive className="h-5 w-5 text-muted-foreground" />}
            description="Kritik seviyedeki kalemler"
          />
        </div>

        {/* 3. Grafikler ve Son Aktiviteler (Grid) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 3a. Satış Grafiği (Ana Grafik) */}
          <div className="lg:col-span-2">
            {/* 'SalesChart' (Adım 110) bileşeni */}
            <SalesChart data={salesReport} />
          </div>

          {/* 3b. Son Randevular (Yan Kart) */}
          <div className="lg:col-span-1">
            {/* 'RecentAppointmentsCard' (Adım 111) bileşeni */}
            <RecentAppointmentsCard data={recentAppointments} />
          </div>
        </div>

        {/* 4. (Opsiyonel) Son Hastalar ve Diğer Raporlar */}
        {/*
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RecentPatientsCard data={recentPatients} />
          </div>
          <div className="lg:col-span-2">
            <ServiceReportChart data={serviceReport} />
          </div>
        </div>
        */}
      </div>
    </>
  );
};

export default DashboardOverviewPage;