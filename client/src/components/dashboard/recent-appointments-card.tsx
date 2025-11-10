"use client";

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Adım 93'te oluşturuldu
import { IRecentAppointment } from '@/api/dashboard-api'; // Adım 79 (API)
import { formatDate } from '@/lib/utils'; // Adım 64 (lib)

/**
 * RecentAppointmentsCard (Son Randevular Kartı)
 *
 * 'DashboardOverviewPage' (Ana Dashboard) üzerinde,
 * API'den gelen 'recentAppointments' verisini (son 5 randevu)
 * listeleyen bir 'Card' bileşenidir.
 */

interface RecentAppointmentsCardProps {
  data: IRecentAppointment[];
}

// Avatar için baş harfleri hesaplayan yardımcı fonksiyon
const getInitials = (name: string | undefined | null) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const RecentAppointmentsCard = ({ data }: RecentAppointmentsCardProps) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.recent_appointments')}</CardTitle>
        <CardDescription>
          Kliniğinizdeki en son planlanan randevular.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 1. Veri Yoksa (No Data) */}
        {!data || data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              {t('generics.no_data')}
            </p>
          </div>
        ) : (
          // 2. Veri Varsa (Listeyi Render Et)
          <div className="space-y-6">
            {data.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center gap-4"
              >
                {/* Avatar (Hastanın baş harfleri) */}
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(appt.patientName)}</AvatarFallback>
                </Avatar>
                
                {/* İsim ve Doktor */}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {appt.patientName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Dr. {appt.doctorName}
                  </p>
                </div>

                {/* Tarih ve Durum */}
                <div className="flex flex-col items-end text-sm">
                  <span className="font-medium">
                    {/* Tarihi formatla (örn. "10.11.2025") */}
                    {formatDate(appt.start, 'short')}
                  </span>
                  {/* TODO: Duruma göre 'Badge' rengi belirle
                    (örn. 'scheduled' -> 'warning', 'completed' -> 'success')
                  */}
                  <Badge variant="warning" className="mt-1 capitalize">
                    {appt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tümünü Gör Düğmesi (Footer) */}
        <Button asChild variant="link" className="mt-6 w-full p-0">
          <Link to="/calendar">
            {t('dashboard.view_all')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};