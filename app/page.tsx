import ConnectButton from "@/_components/connect-button";
import { Card, CardContent, CardFooter, CardHeader } from "@/_components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-4xl font-semibold tracking-tight text-center">SQLito</h1>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-lg text-muted-foreground">
            Business Intelligence for Tech-Challenged Bosses
          </p>
          <p className="text-sm text-muted-foreground/80 mt-2">
            Connect your Supabase database to get started
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <ConnectButton />
        </CardFooter>
      </Card>
    </main>
  );
}
