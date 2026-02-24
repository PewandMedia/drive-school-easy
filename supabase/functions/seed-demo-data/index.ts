import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// German first/last names
const VORNAMEN = [
  "Maximilian","Alexander","Lukas","Leon","Paul","Jonas","Felix","Elias","Noah","Ben",
  "Luca","Finn","Tim","Julian","David","Moritz","Niklas","Jan","Tom","Erik",
  "Philipp","Tobias","Simon","Fabian","Marcel","Sebastian","Daniel","Kevin","Dennis","Patrick",
  "Marco","Stefan","Michael","Thomas","Christian","Andreas","Martin","Markus","Florian","Oliver",
  "Laura","Anna","Lena","Sarah","Julia","Lisa","Marie","Sophie","Emma","Mia",
  "Hannah","Leonie","Amelie","Emily","Johanna","Sophia","Clara","Lea","Nina","Jana",
  "Katharina","Christina","Melanie","Vanessa","Jessica","Sabrina","Nadine","Jennifer","Michelle","Jasmin",
  "Pia","Lara","Nele","Franziska","Stefanie","Nicole","Sandra","Marina","Alina","Maja",
  "Ali","Mehmet","Emre","Can","Yusuf","Hasan","Kemal","Deniz","Amir","Omar",
  "Fatma","Ayse","Zeynep","Elif","Merve","Selin","Esra","Nur","Derya","Tugba"
];

const NACHNAMEN = [
  "Mueller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann",
  "Schafer","Koch","Bauer","Richter","Klein","Wolf","Schroeder","Neumann","Schwarz","Zimmermann",
  "Braun","Krueger","Hofmann","Hartmann","Lange","Schmitt","Werner","Schmitz","Krause","Meier",
  "Lehmann","Schmid","Schulze","Maier","Koehler","Herrmann","Koenig","Walter","Mayer","Huber",
  "Kaiser","Fuchs","Peters","Lang","Scholz","Moeller","Weiss","Jung","Hahn","Schubert",
  "Vogel","Friedrich","Keller","Guenther","Frank","Berger","Winkler","Roth","Beck","Lorenz",
  "Baumann","Franke","Albrecht","Schuster","Simon","Ludwig","Boehm","Winter","Kraus","Martin",
  "Schumacher","Kraemer","Vogt","Stein","Jansen","Otto","Sommer","Gross","Seidel","Heinrich",
  "Brandt","Haas","Schreiber","Graf","Dietrich","Ziegler","Kuhn","Kuehn","Pohl","Engel",
  "Horn","Busch","Bergmann","Thomas","Voigt","Sauer","Arnold","Wolff","Pfeiffer","Brinkmann"
];

const STRASSEN = [
  "Hauptstraße","Bahnhofstraße","Schulstraße","Gartenstraße","Kirchstraße","Berliner Straße",
  "Friedrichstraße","Schillerstraße","Goethestraße","Mozartstraße","Beethovenstraße",
  "Jahnstraße","Bismarckstraße","Lessingstraße","Ringstraße","Waldstraße",
  "Bergstraße","Lindenstraße","Rosenweg","Birkenweg","Eichenweg","Am Markt",
  "Dorfstraße","Parkstraße","Mühlenweg","Industriestraße","Nordstraße","Südstraße",
  "Oststraße","Weststraße"
];

const STAEDTE = ["Bochum","Herne","Gelsenkirchen","Essen","Dortmund","Witten","Castrop-Rauxel"];
const PLZ = ["44787","44625","44649","45127","44135","58452","44575"];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(d: Date): string {
  return d.toISOString();
}

function generateStudent(registrationDate: Date) {
  const vorname = pick(VORNAMEN);
  const nachname = pick(NACHNAMEN);
  const gebJahr = rand(1991, 2009);
  const gebMonat = rand(1, 12);
  const gebTag = rand(1, 28);
  const stadtIdx = rand(0, STAEDTE.length - 1);

  const klassRoll = Math.random();
  const klasse = klassRoll < 0.6 ? "B" : klassRoll < 0.85 ? "B197" : "B78";

  return {
    vorname,
    nachname,
    geburtsdatum: `${gebJahr}-${String(gebMonat).padStart(2,"0")}-${String(gebTag).padStart(2,"0")}`,
    email: `${vorname.toLowerCase()}.${nachname.toLowerCase()}${rand(1,999)}@example.de`,
    telefon: `0${rand(151,179)}${rand(1000000,9999999)}`,
    adresse: `${pick(STRASSEN)} ${rand(1,150)}, ${PLZ[stadtIdx]} ${STAEDTE[stadtIdx]}`,
    fahrschule: Math.random() < 0.5 ? "riemke" : "rathaus",
    fuehrerscheinklasse: klasse,
    ist_umschreiber: false,
    created_at: formatDate(registrationDate),
    status: null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Load instructors and prices
    const { data: instructors } = await supabase.from("instructors").select("id").eq("aktiv", true);
    const { data: prices } = await supabase.from("prices").select("*").eq("aktiv", true);

    if (!instructors?.length || !prices?.length) {
      return new Response(JSON.stringify({ error: "No instructors or prices found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const grundbetragPrice = prices.find(p => p.bezeichnung === "Grundbetrag");
    const lernmaterialPrice = prices.find(p => p.bezeichnung === "Lernmaterial");
    const theoriePruefungPrice = prices.find(p => p.bezeichnung?.includes("Theorieprüfung"));
    const praxisPruefungPrice = prices.find(p => p.bezeichnung?.includes("Praktische Prüfung"));

    // Accept count from request body
    let requestedCount = 400;
    try {
      const body = await req.json();
      if (body?.count) requestedCount = Math.min(body.count, 500);
    } catch { /* no body, use default */ }

    const TOTAL = requestedCount;
    const BATCH = 10;
    const startDate = new Date("2025-12-01T00:00:00Z");
    const endDate = new Date("2026-02-24T00:00:00Z");

    let created = 0;

    for (let batch = 0; batch < TOTAL / BATCH; batch++) {
      const studentBatch = [];
      for (let i = 0; i < BATCH; i++) {
        const regDate = randomDate(startDate, endDate);
        studentBatch.push(generateStudent(regDate));
      }

      const { data: insertedStudents, error: sErr } = await supabase
        .from("students")
        .insert(studentBatch)
        .select("id, created_at, fuehrerscheinklasse");

      if (sErr) {
        console.error("Student insert error:", sErr);
        continue;
      }

      // Process each student
      for (const student of insertedStudents!) {
        const progress = Math.random(); // 0-1
        const regDate = new Date(student.created_at);
        const klasse = student.fuehrerscheinklasse;

        // === SERVICES (everyone gets Grundbetrag + Lernmaterial) ===
        const services = [];
        if (grundbetragPrice) {
          services.push({
            student_id: student.id,
            bezeichnung: grundbetragPrice.bezeichnung,
            preis: grundbetragPrice.preis,
            preis_id: grundbetragPrice.id,
            created_at: formatDate(regDate),
          });
        }
        if (lernmaterialPrice && progress > 0.1) {
          services.push({
            student_id: student.id,
            bezeichnung: lernmaterialPrice.bezeichnung,
            preis: lernmaterialPrice.preis,
            preis_id: lernmaterialPrice.id,
            created_at: formatDate(new Date(regDate.getTime() + rand(1, 5) * 86400000)),
          });
        }
        if (services.length) {
          await supabase.from("services").insert(services);
        }

        // === THEORY SESSIONS (progress > 0.2) ===
        if (progress > 0.2) {
          const maxGrundstoff = progress > 0.7 ? 14 : Math.floor(progress * 18);
          const grundstoffCount = rand(1, Math.max(1, maxGrundstoff));
          const theorySessions = [];

          for (let t = 0; t < grundstoffCount; t++) {
            const tDate = new Date(regDate.getTime() + rand(1, 80) * 86400000);
            if (tDate > endDate) continue;
            theorySessions.push({
              student_id: student.id,
              typ: "grundstoff",
              lektion: (t % 14) + 1,
              datum: formatDate(tDate),
            });
          }

          // Klassenspezifisch
          if (progress > 0.4) {
            const ksCount = rand(1, 2);
            for (let k = 0; k < ksCount; k++) {
              const kDate = new Date(regDate.getTime() + rand(30, 85) * 86400000);
              if (kDate > endDate) continue;
              theorySessions.push({
                student_id: student.id,
                typ: "klassenspezifisch",
                lektion: k + 1,
                datum: formatDate(kDate),
              });
            }
          }

          if (theorySessions.length) {
            await supabase.from("theory_sessions").insert(theorySessions);
          }
        }

        // === DRIVING LESSONS (progress > 0.25) ===
        if (progress > 0.25) {
          const maxLessons = Math.floor(progress * 25);
          const lessonCount = rand(1, Math.max(1, maxLessons));
          const lessons = [];

          for (let l = 0; l < lessonCount; l++) {
            const lDate = new Date(regDate.getTime() + rand(7, 85) * 86400000);
            if (lDate > endDate) continue;

            let typ: string;
            if (l < lessonCount * 0.6) {
              typ = "uebungsstunde";
            } else if (l < lessonCount * 0.75) {
              typ = "ueberland";
            } else if (l < lessonCount * 0.85) {
              typ = "autobahn";
            } else if (l < lessonCount * 0.95) {
              typ = "nacht";
            } else if (klasse === "B197") {
              typ = "testfahrt_b197";
            } else {
              typ = "uebungsstunde";
            }

            const dauer = pick([45, 90, 90, 90, 135]);
            const fahrzeugTyp = (klasse === "B78" || typ === "testfahrt_b197") ? "schaltwagen" : "automatik";

            lessons.push({
              student_id: student.id,
              typ,
              dauer_minuten: dauer,
              fahrzeug_typ: fahrzeugTyp,
              datum: formatDate(lDate),
            });
          }

          if (lessons.length) {
            // Insert one by one so trigger calculates price and creates open_item
            for (const lesson of lessons) {
              await supabase.from("driving_lessons").insert(lesson);
            }
          }
        }

        // === GEAR LESSONS (B197 only, progress > 0.4) ===
        if (klasse === "B197" && progress > 0.4) {
          const gearCount = rand(1, Math.min(10, Math.floor(progress * 12)));
          const gearLessons = [];
          for (let g = 0; g < gearCount; g++) {
            const gDate = new Date(regDate.getTime() + rand(20, 85) * 86400000);
            if (gDate > endDate) continue;
            gearLessons.push({
              student_id: student.id,
              dauer_minuten: 45,
              datum: formatDate(gDate),
            });
          }
          if (gearLessons.length) {
            await supabase.from("gear_lessons").insert(gearLessons);
          }
        }

        // === EXAMS (progress > 0.5) ===
        if (progress > 0.5) {
          // Theory exam
          if (theoriePruefungPrice) {
            const tExamDate = new Date(regDate.getTime() + rand(40, 80) * 86400000);
            if (tExamDate <= endDate) {
              const bestanden = progress > 0.6 ? Math.random() > 0.2 : Math.random() > 0.5;
              await supabase.from("exams").insert({
                student_id: student.id,
                typ: "theorie",
                datum: formatDate(tExamDate),
                preis: theoriePruefungPrice.preis,
                bestanden,
                fahrzeug_typ: "automatik",
              });
            }
          }

          // Practical exam (progress > 0.75)
          if (progress > 0.75 && praxisPruefungPrice) {
            const pExamDate = new Date(regDate.getTime() + rand(60, 85) * 86400000);
            if (pExamDate <= endDate) {
              const bestanden = Math.random() > 0.35;
              const fahrzeugTyp = klasse === "B78" ? "schaltwagen" : "automatik";
              await supabase.from("exams").insert({
                student_id: student.id,
                typ: "praxis",
                datum: formatDate(pExamDate),
                preis: praxisPruefungPrice.preis,
                bestanden,
                fahrzeug_typ: fahrzeugTyp,
                instructor_id: pick(instructors).id,
              });
            }
          }
        }

        // === PAYMENTS ===
        // Wait briefly for triggers to create open_items
        // Then fetch open items and create payments for 30-90%
        const { data: openItems } = await supabase
          .from("open_items")
          .select("id, betrag_gesamt, datum")
          .eq("student_id", student.id)
          .eq("status", "offen")
          .order("datum", { ascending: true });

        if (openItems && openItems.length > 0) {
          const payRatio = 0.3 + Math.random() * 0.6; // 30-90%
          const totalOwed = openItems.reduce((s, oi) => s + Number(oi.betrag_gesamt), 0);
          let budgetLeft = totalOwed * payRatio;

          for (const oi of openItems) {
            if (budgetLeft <= 0) break;
            const oiBetrag = Number(oi.betrag_gesamt);
            const payAmount = Math.min(oiBetrag, budgetLeft);
            budgetLeft -= payAmount;

            const zahlungsart = pick(["bar", "ec", "ueberweisung"] as const);
            const payDate = new Date(new Date(oi.datum).getTime() + rand(1, 14) * 86400000);

            const { data: payment } = await supabase
              .from("payments")
              .insert({
                student_id: student.id,
                betrag: Math.round(payAmount * 100) / 100,
                zahlungsart,
                datum: formatDate(payDate > endDate ? endDate : payDate),
              })
              .select("id")
              .single();

            if (payment) {
              await supabase.from("payment_allocations").insert({
                payment_id: payment.id,
                open_item_id: oi.id,
                betrag: Math.round(payAmount * 100) / 100,
              });
            }
          }
        }
      }

      created += insertedStudents!.length;
      console.log(`Batch ${batch + 1}/${TOTAL / BATCH} done. Total: ${created}`);
    }

    return new Response(JSON.stringify({ success: true, created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
