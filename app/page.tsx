import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { BerandaData } from "@/components/beranda/BerandaData";
import { LandingView } from "@/components/beranda/LandingView";

export default function BerandaPage() {
  return (
    <BerandaData>
      <div className="page-canvas paper-canvas min-h-screen">
        <NavBar
          active="beranda"
          cta={
            <Link href="/peta" className="b bp">
              Buka peta
            </Link>
          }
        />
        <LandingView />
      </div>
    </BerandaData>
  );
}
