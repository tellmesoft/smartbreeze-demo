import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  PrismaClient,
  Rol,
  EstadoEquipo,
  EstadoMantenimiento,
  Prioridad,
  EstadoAlerta,
  TipoEquipo,
} from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function svgBase64(label: string, bg = "#e5e7eb", color = "#374151") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect fill="${bg}" width="320" height="240" rx="8"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="${color}" font-family="Arial,sans-serif" font-size="18">${label}</text></svg>`;
  return Buffer.from(svg).toString("base64");
}

function qrBase64(code: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="#fff" width="160" height="160"/><rect fill="#111" x="10" y="10" width="40" height="40"/><rect fill="#111" x="110" y="10" width="40" height="40"/><rect fill="#111" x="10" y="110" width="40" height="40"/><text x="80" y="88" text-anchor="middle" fill="#111" font-size="8" font-family="monospace">${code.slice(0, 12)}</text></svg>`;
  return Buffer.from(svg).toString("base64");
}

function dateOnly(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function main() {
  await prisma.evidenciaMantenimiento.deleteMany();
  await prisma.esterilizacion.deleteMany();
  await prisma.parametrosHvac.deleteMany();
  await prisma.alerta.deleteMany();
  await prisma.mantenimiento.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.ubicacion.deleteMany();
  await prisma.usuario.deleteMany();

  const admin = await prisma.usuario.create({
    data: {
      nombre: "María González",
      email: "admin@smartbreeze.local",
      password: "demo123",
      rol: Rol.ADMINISTRADOR,
      avatarBase64: svgBase64("MG", "#2563eb", "#ffffff"),
    },
  });

  const tecnico = await prisma.usuario.create({
    data: {
      nombre: "Carlos Mendoza",
      email: "tecnico@smartbreeze.local",
      password: "demo123",
      rol: Rol.TECNICO,
      avatarBase64: svgBase64("CM", "#059669", "#ffffff"),
    },
  });

  const encargado = await prisma.usuario.create({
    data: {
      nombre: "Ana Ruiz",
      email: "encargado@smartbreeze.local",
      password: "demo123",
      rol: Rol.ENCARGADO,
      avatarBase64: svgBase64("AR", "#d97706", "#ffffff"),
    },
  });

  const ubicaciones = await Promise.all([
    prisma.ubicacion.create({
      data: {
        nombre: "Sala 302",
        sector: "Campus Central",
        facultad: "Facultad de Ingeniería",
        edificio: "Raúl Devés",
        piso: "3° piso",
        direccion: "Av. El Bosque 1214, Santiago",
        descripcion: "Aula climatizada con split mural.",
        fotoBase64: svgBase64("Sala 302", "#dbeafe", "#1e40af"),
      },
    }),
    prisma.ubicacion.create({
      data: {
        nombre: "Sala de Máquinas A",
        sector: "Servicios técnicos",
        facultad: "Facultad de Ingeniería",
        edificio: "Edificio Central",
        piso: "Subsuelo",
        direccion: "Av. El Bosque 1214, Santiago",
        descripcion: "Sala principal de equipos HVAC del edificio central.",
        fotoBase64: svgBase64("Sala A", "#dbeafe", "#1e40af"),
      },
    }),
    prisma.ubicacion.create({
      data: {
        nombre: "Laboratorio Química",
        sector: "Ciencias",
        facultad: "Facultad de Ciencias",
        edificio: "Pabellón Norte",
        piso: "2° piso",
        direccion: "Av. El Bosque 1214, Santiago",
        descripcion: "Área de climatización para laboratorios.",
        fotoBase64: svgBase64("Lab Química", "#dcfce7", "#166534"),
      },
    }),
    prisma.ubicacion.create({
      data: {
        nombre: "Auditorio Principal",
        sector: "Rectoría",
        facultad: "Rectoría",
        edificio: "Edificio Rectoría",
        piso: "Planta baja",
        direccion: "Av. El Bosque 1180, Santiago",
        descripcion: "Climatización del auditorio institucional.",
        fotoBase64: svgBase64("Auditorio", "#fef3c7", "#92400e"),
      },
    }),
    prisma.ubicacion.create({
      data: {
        nombre: "Biblioteca Central",
        sector: "Servicios generales",
        facultad: "Servicios Generales",
        edificio: "Edificio Biblioteca",
        piso: "1° piso",
        direccion: "Av. El Bosque 1210, Santiago",
        descripcion: "Unidades de tratamiento de aire para áreas de lectura.",
        fotoBase64: svgBase64("Biblioteca", "#ede9fe", "#5b21b6"),
      },
    }),
  ]);

  const ultimaMant = dateOnly(2026, 6, 7);
  const proximaMant = dateOnly(2026, 9, 7);

  const equiposData = [
    {
      codigoInterno: "SBI-0048",
      codigoQr: "SBI-0048",
      nombre: "Split mural — Sala 302",
      marca: "Anwo",
      modelo: "AW-18K",
      serie: "AN-2024-0048",
      btu: 18000,
      refrigerante: "R410A",
      tipoEquipo: TipoEquipo.SPLIT,
      fechaInstalacion: dateOnly(2024, 3, 15),
      ultimaMantenimiento: ultimaMant,
      proximaMantenimiento: proximaMant,
      estado: EstadoEquipo.OPERATIVO,
      ubicacionId: ubicaciones[0].id,
      descripcion: "Equipo de referencia para consulta QR demo.",
    },
    {
      codigoInterno: "SBI-0001",
      codigoQr: "SBI-0001",
      nombre: "Manejadora de Aire Principal",
      marca: "Carrier",
      modelo: "39M",
      serie: "CA-2021-8842",
      btu: 120000,
      refrigerante: "R134a",
      tipoEquipo: TipoEquipo.MANEJADORA,
      fechaInstalacion: dateOnly(2021, 8, 10),
      estado: EstadoEquipo.OPERATIVO,
      ubicacionId: ubicaciones[1].id,
      ultimaMantenimiento: dateOnly(2026, 5, 12),
      proximaMantenimiento: dateOnly(2026, 8, 12),
    },
    {
      codigoInterno: "SBI-0002",
      codigoQr: "SBI-0002",
      nombre: "Chiller Trane",
      marca: "Trane",
      modelo: "CGAM",
      serie: "TR-2019-3310",
      btu: 350000,
      refrigerante: "R410A",
      tipoEquipo: TipoEquipo.CHILLER,
      fechaInstalacion: dateOnly(2019, 5, 20),
      ultimaMantenimiento: dateOnly(2026, 6, 1),
      proximaMantenimiento: dateOnly(2026, 6, 20),
      estado: EstadoEquipo.MANTENIMIENTO,
      ubicacionId: ubicaciones[1].id,
    },
    {
      codigoInterno: "SBI-0003",
      codigoQr: "SBI-0003",
      nombre: "Split ducto Lab. Química",
      marca: "Daikin",
      modelo: "FBQ",
      serie: "DK-2020-1192",
      btu: 24000,
      refrigerante: "R32",
      tipoEquipo: TipoEquipo.SPLIT,
      fechaInstalacion: dateOnly(2020, 11, 5),
      ultimaMantenimiento: dateOnly(2026, 3, 10),
      proximaMantenimiento: dateOnly(2026, 6, 10),
      estado: EstadoEquipo.OPERATIVO,
      ubicacionId: ubicaciones[2].id,
    },
    {
      codigoInterno: "SBI-0004",
      codigoQr: "SBI-0004",
      nombre: "Extractor Auditorio",
      marca: "Greenheck",
      modelo: "CUE",
      serie: "GH-2018-7721",
      tipoEquipo: TipoEquipo.EXTRACTOR,
      fechaInstalacion: dateOnly(2018, 2, 12),
      ultimaMantenimiento: dateOnly(2026, 1, 15),
      proximaMantenimiento: dateOnly(2026, 4, 15),
      estado: EstadoEquipo.FALLA,
      ubicacionId: ubicaciones[3].id,
      descripcion: "Extractor con ruido anormal reportado.",
    },
    {
      codigoInterno: "SBI-0005",
      codigoQr: "SBI-0005",
      nombre: "UMA Biblioteca Norte",
      marca: "York",
      modelo: "YCIV",
      serie: "YK-2022-0044",
      btu: 60000,
      refrigerante: "R410A",
      tipoEquipo: TipoEquipo.MANEJADORA,
      fechaInstalacion: dateOnly(2022, 1, 18),
      ultimaMantenimiento: dateOnly(2026, 4, 2),
      proximaMantenimiento: dateOnly(2026, 7, 2),
      estado: EstadoEquipo.OPERATIVO,
      ubicacionId: ubicaciones[4].id,
    },
    {
      codigoInterno: "SBI-0006",
      codigoQr: "SBI-0006",
      nombre: "Torre de Enfriamiento",
      marca: "Baltimore Aircoil",
      modelo: "VXT",
      serie: "BA-2017-5520",
      tipoEquipo: TipoEquipo.TORRE_ENFRIAMIENTO,
      fechaInstalacion: dateOnly(2017, 9, 30),
      ultimaMantenimiento: dateOnly(2026, 5, 28),
      proximaMantenimiento: dateOnly(2026, 6, 18),
      estado: EstadoEquipo.MANTENIMIENTO,
      ubicacionId: ubicaciones[1].id,
    },
    {
      codigoInterno: "SBI-0007",
      codigoQr: "SBI-0007",
      nombre: "Fan Coil Aula 204",
      marca: "LG",
      modelo: "ARNU",
      serie: "LG-2021-9033",
      btu: 12000,
      refrigerante: "R410A",
      tipoEquipo: TipoEquipo.FAN_COIL,
      fechaInstalacion: dateOnly(2021, 6, 22),
      ultimaMantenimiento: dateOnly(2026, 2, 20),
      proximaMantenimiento: dateOnly(2026, 5, 20),
      estado: EstadoEquipo.OPERATIVO,
      ubicacionId: ubicaciones[2].id,
    },
    {
      codigoInterno: "SBI-0008",
      codigoQr: "SBI-0008",
      nombre: "Bomba de Circulación",
      marca: "Grundfos",
      modelo: "CR",
      serie: "GR-2020-6611",
      tipoEquipo: TipoEquipo.BOMBA,
      fechaInstalacion: dateOnly(2020, 4, 8),
      ultimaMantenimiento: dateOnly(2025, 11, 5),
      proximaMantenimiento: dateOnly(2026, 2, 5),
      estado: EstadoEquipo.FUERA_SERVICIO,
      ubicacionId: ubicaciones[1].id,
    },
  ];

  const equipos = [];
  for (const data of equiposData) {
    const equipo = await prisma.equipo.create({
      data: {
        ...data,
        tecnicoId: tecnico.id,
        manualUrl: "https://example.com/manual-hvac",
        fotoBase64: svgBase64(data.codigoInterno, "#f3f4f6", "#111827"),
        qrBase64: qrBase64(data.codigoQr),
      },
    });
    equipos.push(equipo);
  }

  const now = new Date();
  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  const mantenimientoHero = await prisma.mantenimiento.create({
    data: {
      titulo: "Mantención preventiva trimestral — Split Anwo",
      equipoId: equipos[0].id,
      tecnicoId: tecnico.id,
      fechaProgramada: ultimaMant,
      fechaRealizada: ultimaMant,
      horasTrabajadas: 2.5,
      observaciones: "Limpieza de filtros, revisión de presiones y esterilización de líneas.",
      estadoGeneral: "Operativo",
      proximaMantenimiento: proximaMant,
      estado: EstadoMantenimiento.COMPLETADO,
      prioridad: Prioridad.MEDIA,
      recurrencia: "Se repite cada 3 meses",
      parametrosHvac: {
        create: {
          voltaje: 220,
          amperaje: 8.5,
          presionBaja: 118,
          presionAlta: 410,
          temperaturaRetorno: 22,
          temperaturaImpulsion: 12,
          temperaturaAmbiente: 24,
          subenfriamiento: 10,
          sobrecalentamiento: 8,
        },
      },
      esterilizacion: {
        create: {
          aplicada: true,
          metodo: "UV-C + aplicación biocida",
          horasExposicion: 1.5,
          observaciones: "Esterilización aplicada según protocolo institucional.",
        },
      },
      evidencia: {
        create: {
          fotoAntesBase64: svgBase64("Antes", "#fee2e2", "#991b1b"),
          fotoDespuesBase64: svgBase64("Después", "#dcfce7", "#166534"),
          firmaClienteBase64: svgBase64("Firma", "#e0e7ff", "#3730a3"),
          pdfGeneradoBase64: svgBase64("PDF", "#f3f4f6", "#374151"),
        },
      },
    },
  });

  await prisma.mantenimiento.createMany({
    data: [
      {
        titulo: "PM mensual — Manejadora de Aire",
        equipoId: equipos[1].id,
        tecnicoId: tecnico.id,
        fechaProgramada: addDays(3),
        estado: EstadoMantenimiento.PENDIENTE,
        prioridad: Prioridad.MEDIA,
        recurrencia: "Se repite cada 1 mes",
        observaciones: "Revisar filtros, bandejas de condensado y sensores.",
      },
      {
        titulo: "Inspección chiller — Trane CGAM",
        equipoId: equipos[2].id,
        tecnicoId: tecnico.id,
        fechaProgramada: addDays(-2),
        estado: EstadoMantenimiento.EN_PROGRESO,
        prioridad: Prioridad.ALTA,
        observaciones: "Verificar presiones y nivel de refrigerante.",
      },
      {
        titulo: "Limpieza filtros — Split Lab. Química",
        equipoId: equipos[3].id,
        tecnicoId: tecnico.id,
        fechaProgramada: addDays(7),
        estado: EstadoMantenimiento.PENDIENTE,
        prioridad: Prioridad.BAJA,
        recurrencia: "Se repite cada 3 meses",
      },
      {
        titulo: "Reparación extractor — Auditorio",
        equipoId: equipos[4].id,
        tecnicoId: tecnico.id,
        fechaProgramada: addDays(-1),
        estado: EstadoMantenimiento.PENDIENTE,
        prioridad: Prioridad.ALTA,
        observaciones: "Ruido en rodamientos — prioridad por evento programado.",
      },
      {
        titulo: "PM trimestral — UMA Biblioteca",
        equipoId: equipos[5].id,
        tecnicoId: tecnico.id,
        fechaProgramada: addDays(-10),
        fechaRealizada: addDays(-9),
        horasTrabajadas: 3,
        estadoGeneral: "Operativo",
        proximaMantenimiento: addDays(80),
        estado: EstadoMantenimiento.COMPLETADO,
        prioridad: Prioridad.MEDIA,
        observaciones: "Mantenimiento completado sin novedades.",
      },
      {
        titulo: "Revisión torre de enfriamiento",
        equipoId: equipos[6].id,
        tecnicoId: tecnico.id,
        fechaProgramada: addDays(1),
        estado: EstadoMantenimiento.EN_ESPERA,
        prioridad: Prioridad.MEDIA,
      },
    ],
  });

  await prisma.alerta.createMany({
    data: [
      {
        equipoId: equipos[4].id,
        reportadoPor: encargado.id,
        descripcion: "Ruido anormal en extractor del auditorio durante funcionamiento.",
        prioridad: Prioridad.ALTA,
        estado: EstadoAlerta.ABIERTA,
        fecha: addDays(-1),
      },
      {
        equipoId: equipos[7].id,
        reportadoPor: encargado.id,
        descripcion: "Bomba fuera de servicio — sin circulación en circuito secundario.",
        prioridad: Prioridad.ALTA,
        estado: EstadoAlerta.EN_REVISION,
        fecha: addDays(-3),
      },
      {
        equipoId: equipos[2].id,
        reportadoPor: admin.id,
        descripcion: "Temperatura de salida por encima del rango operativo.",
        prioridad: Prioridad.MEDIA,
        estado: EstadoAlerta.ABIERTA,
        fecha: addDays(-2),
      },
      {
        equipoId: equipos[5].id,
        reportadoPor: encargado.id,
        descripcion: "Filtro sucio reportado por personal de biblioteca.",
        prioridad: Prioridad.BAJA,
        estado: EstadoAlerta.RESUELTA,
        fecha: addDays(-15),
      },
    ],
  });

  console.log("Seed completado:");
  console.log("- Usuarios demo: admin / tecnico / encargado @smartbreeze.local (clave: demo123)");
  console.log(`- ${equipos.length} equipos HVAC (referencia QR: SBI-0048)`);
  console.log(`- ${ubicaciones.length} ubicaciones`);
  console.log(`- Mantenimiento con parámetros HVAC: ${mantenimientoHero.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
