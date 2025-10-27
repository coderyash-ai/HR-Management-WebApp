import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, QrCode } from 'lucide-react';

export default function QRCodePage() {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=staffsync-pro-registration-token-for-new-employee&bgcolor=1E293B&color=64B5F6&qzone=1`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
           <div className="flex justify-center mb-4">
            <div className="bg-primary/20 text-primary p-3 rounded-full">
                <QrCode className="h-8 w-8" />
            </div>
        </div>
          <CardTitle>QR Code Registration</CardTitle>
          <CardDescription>
            New employees, please scan this code with your device to register.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="p-4 bg-card-foreground/5 rounded-lg">
            <Image
              src={qrCodeUrl}
              alt="Registration QR Code"
              width={250}
              height={250}
              priority
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
