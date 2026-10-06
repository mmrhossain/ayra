import Link from "next/link";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Vendor pending-approval page.
 *
 * Shown by the middleware while a vendor's account has isApproved === false.
 * Rendering strategy: static SSR (no dynamic data).
 */
export default function VendorPendingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Clock className="mb-2 size-10 text-amber-500" />
          <CardTitle className="text-xl">অনুমোদনের অপেক্ষায়</CardTitle>
          <CardDescription>
            আপনার ভেন্ডর অ্যাকাউন্টটি এখনো অ্যাডমিন অনুমোদনের অপেক্ষায় আছে।
            অনুমোদনের পর আপনি নিজের দোকান পরিচালনা করতে পারবেন।
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">স্টোরে ফিরে যান</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
