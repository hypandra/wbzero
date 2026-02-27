import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'
import { ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  return (
    <div className="dark min-h-screen flex items-center justify-center bg-gradient-to-br from-[#05030f] via-[#0e0520] to-[#000000] text-white relative overflow-hidden">
      {/* Center glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(100,60,200,0.18) 0%, transparent 65%)' }} />
      {/* Stars */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {[
          [8,12],[15,72],[22,38],[31,55],[37,18],[44,88],[52,6],[58,43],[65,29],[71,67],
          [78,14],[84,51],[91,82],[96,33],[5,90],[25,5],[48,76],[62,22],[80,60],[13,47],
          [40,95],[70,8],[88,40],[34,70],[56,15],[18,85],[74,55],[92,20],[28,62],[50,35],
          [3,25],[11,60],[19,44],[27,78],[35,8],[43,63],[51,91],[59,17],[67,50],[75,33],
          [83,72],[89,15],[94,58],[7,38],[16,83],[24,12],[32,67],[41,29],[49,54],[57,88],
          [63,4],[72,41],[81,19],[87,75],[93,46],[2,70],[10,31],[20,96],[30,48],[38,22],
          [6,52],[14,27],[21,74],[29,10],[36,88],[45,36],[53,61],[60,80],[68,18],[76,45],
          [85,28],[90,64],[97,7],[4,42],[12,93],[23,58],[33,14],[42,79],[50,23],[61,47],
        ].map(([cx, cy], i) => {
          const tierClass = i % 4 === 0 ? 'star-bright' : i % 3 === 0 ? 'star-mid' : 'star-dim'
          return (
            <circle
              key={i}
              className={tierClass}
              cx={`${cx}%`}
              cy={`${cy}%`}
              r={i % 5 === 0 ? "1.4" : i % 3 === 0 ? "1.0" : "0.6"}
              fill="white"
              style={{
                '--star-duration': `${2.5 + (i % 7) * 0.7}s`,
                animationDelay: `${(i % 11) * 0.4}s`,
              } as React.CSSProperties}
            />
          )
        })}
      </svg>
      <div className="max-w-md w-full space-y-8 p-8 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl font-light tracking-wide">world builder zero</h1>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/90 transition-colors duration-200">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </div>
    </div>
  )
}
