import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Партнёрская программа StudioSlow',
  description: 'Присоединяйтесь к партнёрской программе StudioSlow и зарабатывайте на рекомендациях.',
};

const benefits = [
  'Честная комиссия за оплаченные заказы',
  'Прозрачный учёт лидов и выплат',
  'Личный кабинет с отчётами в реальном времени',
];

export default function PartnersLandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-16">
        <p className="text-sm text-muted-foreground">StudioSlow × Refferq</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Партнёрская программа StudioSlow
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Приводите клиентов, получайте вознаграждение и управляйте всем в одном кабинете.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/register">Принять участие</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Уже партнёр? Войти</Link>
          </Button>
        </div>

        <section className="mt-12 rounded-2xl border bg-card p-6">
          <h2 className="text-base font-medium">Почему это удобно</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {benefits.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border bg-card p-6">
          <h2 className="text-base font-medium">Вход в личный кабинет</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/affiliate">Кабинет партнёра</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">Кабинет администратора</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/login">Войти по email</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
