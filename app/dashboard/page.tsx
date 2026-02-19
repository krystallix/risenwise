export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="bg-muted/50 rounded-lg p-6 min-h-[400px]">
        <p className="text-muted-foreground">Welcome to your dashboard</p>
      </div>
    </div>
  )
}
