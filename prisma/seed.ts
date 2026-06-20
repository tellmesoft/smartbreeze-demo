import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPgPool } from "../src/lib/db-pool";
import {
  PrismaClient,
  Rol,
  EstadoEquipo,
  EstadoMantenimiento,
  Prioridad,
  EstadoAlerta,
  TipoEquipo,
  TipoRepuesto,
  TipoMovimientoRepuesto,
  ResultadoInspeccion,
  UnidadMedidor,
  FrecuenciaLectura,
  TipoProveedor,
} from "../src/generated/prisma/client";
import {
  attachProcedimientoToMantenimiento,
} from "../src/lib/procedimientos";
import { computeProximaLectura } from "../src/lib/medidores";

const pool = createPgPool();
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
  await prisma.movimientoRepuesto.deleteMany();
  await prisma.lecturaMedidor.deleteMany();
  await prisma.medidor.deleteMany();
  await prisma.procedimientoItemRespuesta.deleteMany();
  await prisma.alerta.deleteMany();
  await prisma.mantenimiento.deleteMany();
  await prisma.repuesto.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.procedimientoItem.deleteMany();
  await prisma.procedimiento.deleteMany();
  await prisma.equipo.deleteMany();
  await prisma.ubicacion.deleteMany();
  await prisma.usuario.deleteMany();

  const admin = await prisma.usuario.create({
    data: {
      nombre: "María González",
      email: "admin@smartbreeze.local",
      password: "sbi2026",
      rol: Rol.ADMINISTRADOR,
      avatarBase64: svgBase64("MG", "#2563eb", "#ffffff"),
    },
  });

  const tecnico = await prisma.usuario.create({
    data: {
      nombre: "Carlos Mendoza",
      email: "tecnico@smartbreeze.local",
      password: "sbi2026",
      rol: Rol.TECNICO,
      avatarBase64: svgBase64("CM", "#059669", "#ffffff"),
    },
  });

  const encargado = await prisma.usuario.create({
    data: {
      nombre: "Ana Ruiz",
      email: "encargado@smartbreeze.local",
      password: "sbi2026",
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

  const proveedoresData = [
    {
      nombre: "ClimaParts Chile",
      descripcion: "Distribuidor de filtros, serpentines y consumibles para climatización institucional.",
      tipo: TipoProveedor.REPUESTOS,
      email: "ventas@climaparts.cl",
      telefono: "+56 2 2345 6789",
    },
    {
      nombre: "Carrier Parts LATAM",
      descripcion: "Repuestos originales y controles para manejadoras y unidades Carrier.",
      tipo: TipoProveedor.REPUESTOS,
      email: "parts.latam@carrier.com",
      telefono: "+56 2 2987 1200",
    },
    {
      nombre: "Refrigerantes del Sur",
      descripcion: "Suministro certificado de R410A, R32 y R134a para sistemas HVAC.",
      tipo: TipoProveedor.REFRIGERANTE,
      email: "pedidos@refrigerantesur.cl",
      telefono: "+56 9 8765 4321",
    },
    {
      nombre: "Motores Industriales SA",
      descripcion: "Motores EC y ventiladores para UMA, extractores y torres de enfriamiento.",
      tipo: TipoProveedor.REPUESTOS,
      email: "contacto@motoresind.cl",
      telefono: "+56 2 2555 8899",
    },
    {
      nombre: "HVAC Controls",
      descripcion: "Termostatos, sensores y automatización para edificios universitarios.",
      tipo: TipoProveedor.REPUESTOS,
      email: "info@hvaccontrols.cl",
      telefono: "+56 2 2777 3344",
    },
    {
      nombre: "Transmisiones Técnicas",
      descripcion: "Correas, rodamientos y componentes de transmisión para ventilación mecánica.",
      tipo: TipoProveedor.REPUESTOS,
      email: "ventas@transmisiones.cl",
      telefono: "+56 2 2666 1122",
    },
    {
      nombre: "Trane Supply",
      descripcion: "Servicio técnico autorizado y repuestos para chillers Trane CGAM.",
      tipo: TipoProveedor.SERVICIO_TECNICO,
      email: "service@tranesupply.cl",
      telefono: "+56 2 2888 9900",
    },
    {
      nombre: "Electromecánica Central SpA",
      descripcion: "Contratista externo para reparaciones correctivas y balanceo de sistemas HVAC.",
      tipo: TipoProveedor.CONTRATISTA,
      email: "operaciones@electromec.cl",
      telefono: "+56 9 7654 3210",
    },
  ];

  const proveedores: Record<string, { id: string }> = {};
  for (const data of proveedoresData) {
    const p = await prisma.proveedor.create({
      data: { ...data, creadoPorId: admin.id },
    });
    proveedores[data.nombre] = p;
  }

  const now = new Date();
  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  const repuestosSeed = [
    {
      codigoInterno: "REP-0001",
      nombre: "Filtro G4 — 592×592 mm",
      tipo: TipoRepuesto.FILTRO,
      cantidadDisponible: 4,
      cantidadMinima: 2,
      costoUnitario: 18500,
      proveedorNombre: "ClimaParts Chile",
      ubicacionAlmacen: "Bodega Central — Estante A2",
      equipoId: equipos[1].id,
      descripcion: "Filtro plano para manejadora de aire. Reemplazo trimestral recomendado.",
    },
    {
      codigoInterno: "REP-0002",
      nombre: "Control electrónico manejadora",
      tipo: TipoRepuesto.CONTROL,
      cantidadDisponible: 0,
      cantidadMinima: 1,
      cantidadPedida: 2,
      costoUnitario: 107450,
      proveedorNombre: "Carrier Parts LATAM",
      ubicacionAlmacen: "Bodega Central — Estante C1",
      equipoId: equipos[1].id,
      descripcion: "Placa de control con entradas 24 VAC. Compatible con serie 39M.",
    },
    {
      codigoInterno: "REP-0003",
      nombre: "Cilindro R410A — 11,3 kg",
      tipo: TipoRepuesto.REFRIGERANTE,
      cantidadDisponible: 2,
      cantidadMinima: 3,
      costoUnitario: 89000,
      proveedorNombre: "Refrigerantes del Sur",
      ubicacionAlmacen: "Bodega Refrigerantes — Casillero 4",
      descripcion: "Gas refrigerante certificado para sistemas split y chillers.",
    },
    {
      codigoInterno: "REP-0004",
      nombre: "Filtro lavable split mural",
      tipo: TipoRepuesto.FILTRO,
      cantidadDisponible: 6,
      cantidadMinima: 2,
      costoUnitario: 9800,
      proveedorNombre: "ClimaParts Chile",
      ubicacionAlmacen: "Bodega Central — Estante A1",
      equipoId: equipos[0].id,
      descripcion: "Filtro de malla lavable para unidades split de 18.000 BTU.",
    },
    {
      codigoInterno: "REP-0005",
      nombre: "Motor ventilador EC 1 HP",
      tipo: TipoRepuesto.MOTOR,
      cantidadDisponible: 1,
      cantidadMinima: 1,
      costoUnitario: 245000,
      proveedorNombre: "Motores Industriales SA",
      ubicacionAlmacen: "Bodega Central — Estante D3",
      equipoId: equipos[4].id,
      descripcion: "Motor de ventilador de alta eficiencia para UMA.",
    },
    {
      codigoInterno: "REP-0006",
      nombre: "Termostato digital programable",
      tipo: TipoRepuesto.CONTROL,
      cantidadDisponible: 0,
      cantidadMinima: 2,
      cantidadPedida: 4,
      costoUnitario: 42000,
      proveedorNombre: "HVAC Controls",
      ubicacionAlmacen: "Bodega Central — Estante B2",
      equipoId: equipos[0].id,
      descripcion: "Termostato con programación semanal y sensor remoto.",
    },
    {
      codigoInterno: "REP-0007",
      nombre: "Correa trapecoidal SPB 1250",
      tipo: TipoRepuesto.OTRO,
      cantidadDisponible: 3,
      cantidadMinima: 1,
      costoUnitario: 15600,
      proveedorNombre: "Transmisiones Técnicas",
      ubicacionAlmacen: "Bodega Central — Estante E1",
      equipoId: equipos[3].id,
      descripcion: "Correa para extractor centrífugo de auditorio.",
    },
    {
      codigoInterno: "REP-0008",
      nombre: "Sensor de presión baja R410A",
      tipo: TipoRepuesto.ELECTRICO,
      cantidadDisponible: 1,
      cantidadMinima: 2,
      costoUnitario: 67500,
      proveedorNombre: "Trane Supply",
      ubicacionAlmacen: "Bodega Central — Estante C2",
      equipoId: equipos[2].id,
      descripcion: "Transductor de presión para circuito de baja en chiller.",
    },
  ];

  for (const data of repuestosSeed) {
    const { proveedorNombre, ...rest } = data;
    const repuesto = await prisma.repuesto.create({
      data: {
        ...rest,
        proveedorId: proveedores[proveedorNombre].id,
        fotoBase64: svgBase64(rest.codigoInterno, "#eff6ff", "#1e40af"),
        qrBase64: qrBase64(rest.codigoInterno),
      },
    });

    if (data.cantidadDisponible > 0) {
      await prisma.movimientoRepuesto.create({
        data: {
          repuestoId: repuesto.id,
          tipo: TipoMovimientoRepuesto.ENTRADA,
          cantidad: data.cantidadDisponible,
          cantidadResultante: data.cantidadDisponible,
          observaciones: "Stock inicial de demo.",
          fecha: addDays(-30),
        },
      });
    }

    if (data.cantidadDisponible === 0) {
      await prisma.movimientoRepuesto.createMany({
        data: [
          {
            repuestoId: repuesto.id,
            tipo: TipoMovimientoRepuesto.ENTRADA,
            cantidad: 2,
            cantidadResultante: 2,
            observaciones: "Ingreso inicial.",
            fecha: addDays(-45),
          },
          {
            repuestoId: repuesto.id,
            tipo: TipoMovimientoRepuesto.SALIDA,
            cantidad: 2,
            cantidadResultante: 0,
            observaciones: "Consumo en mantenimiento correctivo.",
            fecha: addDays(-10),
          },
        ],
      });
    }
  }

  async function seedMedidor(data: {
    nombre: string;
    unidad: UnidadMedidor;
    frecuencia: FrecuenciaLectura;
    equipoId: string;
    lecturas: { valor: number; daysAgo: number; observaciones?: string }[];
  }) {
    const medidor = await prisma.medidor.create({
      data: {
        nombre: data.nombre,
        unidad: data.unidad,
        frecuencia: data.frecuencia,
        equipoId: data.equipoId,
      },
    });

    for (const lectura of data.lecturas) {
      const fecha = addDays(-lectura.daysAgo);
      await prisma.lecturaMedidor.create({
        data: {
          medidorId: medidor.id,
          valor: lectura.valor,
          fecha,
          observaciones: lectura.observaciones ?? null,
        },
      });
    }

    const ultima = data.lecturas[data.lecturas.length - 1];
    const ultimaLecturaAt = addDays(-ultima.daysAgo);
    await prisma.medidor.update({
      where: { id: medidor.id },
      data: {
        ultimaLectura: ultima.valor,
        ultimaLecturaAt,
        proximaLecturaAt: computeProximaLectura(data.frecuencia, ultimaLecturaAt),
      },
    });

    return medidor;
  }

  const medidoresSeed = [
    {
      nombre: "Horas compresor — Split Sala 302",
      unidad: UnidadMedidor.HORAS,
      frecuencia: FrecuenciaLectura.DIARIA,
      equipoId: equipos[0].id,
      lecturas: [
        { valor: 8420, daysAgo: 14 },
        { valor: 8455, daysAgo: 10 },
        { valor: 8488, daysAgo: 6 },
        { valor: 8510, daysAgo: 5, observaciones: "Lectura antes de mantención trimestral." },
      ],
    },
    {
      nombre: "Presión alta circuito R410A — Chiller",
      unidad: UnidadMedidor.PSI,
      frecuencia: FrecuenciaLectura.SEMANAL,
      equipoId: equipos[2].id,
      lecturas: [
        { valor: 385, daysAgo: 21 },
        { valor: 392, daysAgo: 14 },
        { valor: 398, daysAgo: 7 },
        { valor: 405, daysAgo: 3 },
      ],
    },
    {
      nombre: "Amperaje compresor — Split Anwo",
      unidad: UnidadMedidor.AMPERIOS,
      frecuencia: FrecuenciaLectura.MENSUAL,
      equipoId: equipos[0].id,
      lecturas: [
        { valor: 7.8, daysAgo: 90 },
        { valor: 8.1, daysAgo: 60 },
        { valor: 8.4, daysAgo: 30 },
        { valor: 8.5, daysAgo: 5 },
      ],
    },
    {
      nombre: "ΔT impulsión/retorno — Manejadora principal",
      unidad: UnidadMedidor.DELTA_T,
      frecuencia: FrecuenciaLectura.SEMANAL,
      equipoId: equipos[1].id,
      lecturas: [
        { valor: 11.2, daysAgo: 28 },
        { valor: 10.8, daysAgo: 21 },
        { valor: 9.5, daysAgo: 14 },
        { valor: 8.2, daysAgo: 12, observaciones: "ΔT bajo — revisar caudal y filtros." },
      ],
    },
    {
      nombre: "Consumo eléctrico — UMA Biblioteca",
      unidad: UnidadMedidor.KWH,
      frecuencia: FrecuenciaLectura.MENSUAL,
      equipoId: equipos[5].id,
      lecturas: [
        { valor: 1240, daysAgo: 120 },
        { valor: 1315, daysAgo: 90 },
        { valor: 1388, daysAgo: 60 },
        { valor: 1452, daysAgo: 20 },
      ],
    },
    {
      nombre: "Temperatura impulsión — Split Lab. Química",
      unidad: UnidadMedidor.CELSIUS,
      frecuencia: FrecuenciaLectura.DIARIA,
      equipoId: equipos[3].id,
      lecturas: [
        { valor: 13.5, daysAgo: 4 },
        { valor: 13.2, daysAgo: 3 },
        { valor: 12.8, daysAgo: 2 },
        { valor: 12.5, daysAgo: 1 },
      ],
    },
    {
      nombre: "Presión baja — Chiller Trane CGAM",
      unidad: UnidadMedidor.PSI,
      frecuencia: FrecuenciaLectura.SEMANAL,
      equipoId: equipos[2].id,
      lecturas: [
        { valor: 112, daysAgo: 18 },
        { valor: 115, daysAgo: 11 },
        { valor: 118, daysAgo: 4 },
      ],
    },
    {
      nombre: "Horas motor — Extractor Auditorio",
      unidad: UnidadMedidor.HORAS,
      frecuencia: FrecuenciaLectura.SEMANAL,
      equipoId: equipos[4].id,
      lecturas: [
        { valor: 18200, daysAgo: 35 },
        { valor: 18340, daysAgo: 28 },
        { valor: 18480, daysAgo: 20, observaciones: "Incremento por eventos en auditorio." },
      ],
    },
  ];

  for (const data of medidoresSeed) {
    await seedMedidor(data);
  }

  const procSplit = await prisma.procedimiento.create({
    data: {
      titulo: "PM trimestral — Split mural",
      descripcion: "Protocolo preventivo para equipos split institucionales (18.000–24.000 BTU).",
      tipoEquipo: TipoEquipo.SPLIT,
      creadoPorId: admin.id,
      items: {
        create: [
          { orden: 1, seccion: "Inspección visual", titulo: "Revisar estado de carcasa y aislamiento térmico" },
          { orden: 2, seccion: "Inspección visual", titulo: "Verificar drenaje de condensado sin obstrucciones" },
          { orden: 3, seccion: "Filtros y serpentines", titulo: "Limpiar o reemplazar filtros de aire" },
          { orden: 4, seccion: "Filtros y serpentines", titulo: "Limpiar serpentines del evaporador" },
          { orden: 5, seccion: "Refrigeración", titulo: "Medir presiones de baja y alta (R410A/R32)" },
          { orden: 6, seccion: "Refrigeración", titulo: "Verificar temperatura de impulsión y retorno" },
        ],
      },
    },
    include: { items: true },
  });

  const procManejadora = await prisma.procedimiento.create({
    data: {
      titulo: "PM mensual — Manejadora de aire",
      descripcion: "Checklist mensual para UMA / manejadoras en edificios universitarios.",
      tipoEquipo: TipoEquipo.MANEJADORA,
      creadoPorId: admin.id,
      items: {
        create: [
          { orden: 1, seccion: "Seguridad", titulo: "Confirmar bloqueo y etiquetado LOTO" },
          { orden: 2, seccion: "Filtros", titulo: "Inspeccionar filtros G4/G5 y registrar ΔP" },
          { orden: 3, seccion: "Bandejas", titulo: "Limpiar bandejas de condensado y verificar sifón" },
          { orden: 4, seccion: "Motor y transmisión", titulo: "Revisar correas, rodamientos y vibración" },
          { orden: 5, seccion: "Controles", titulo: "Calibrar sensores de temperatura y actuadores" },
        ],
      },
    },
    include: { items: true },
  });

  const procChiller = await prisma.procedimiento.create({
    data: {
      titulo: "Inspección operativa — Chiller",
      descripcion: "Inspección de chiller: presiones, corrientes y alarmas del compresor.",
      tipoEquipo: TipoEquipo.CHILLER,
      creadoPorId: admin.id,
      items: {
        create: [
          { orden: 1, seccion: "Compresor", titulo: "Registrar amperaje y presión de descarga" },
          { orden: 2, seccion: "Compresor", titulo: "Verificar nivel de aceite y alarmas activas" },
          { orden: 3, seccion: "Circuito hidráulico", titulo: "Revisar caudal y temperatura agua entrada/salida" },
          { orden: 4, seccion: "Refrigerante", titulo: "Detectar fugas en líneas y válvulas de servicio" },
        ],
      },
    },
    include: { items: true },
  });

  const procExtractor = await prisma.procedimiento.create({
    data: {
      titulo: "PM — Extractor / ventilación",
      descripcion: "Mantenimiento de extractores y sistemas de ventilación mecánica.",
      tipoEquipo: TipoEquipo.EXTRACTOR,
      creadoPorId: admin.id,
      items: {
        create: [
          { orden: 1, seccion: "Inspección", titulo: "Revisar hélice/rotor y guardas de protección" },
          { orden: 2, seccion: "Motor", titulo: "Medir vibración y temperatura de rodamientos" },
          { orden: 3, seccion: "Transmisión", titulo: "Ajustar tensión de correas o acople" },
        ],
      },
    },
    include: { items: true },
  });

  const procGeneral = await prisma.procedimiento.create({
    data: {
      titulo: "Checklist general HVAC institucional",
      descripcion: "Procedimiento genérico cuando no existe plantilla específica por tipo de equipo.",
      tipoEquipo: null,
      creadoPorId: admin.id,
      items: {
        create: [
          { orden: 1, seccion: "General", titulo: "Confirmar ubicación y código del equipo" },
          { orden: 2, seccion: "General", titulo: "Registrar estado operativo y observaciones iniciales" },
          { orden: 3, seccion: "Cierre", titulo: "Dejar área limpia y equipo en servicio" },
        ],
      },
    },
    include: { items: true },
  });

  const procedimientoPorTipo: Partial<Record<TipoEquipo, typeof procSplit>> = {
    SPLIT: procSplit,
    MANEJADORA: procManejadora,
    CHILLER: procChiller,
    EXTRACTOR: procExtractor,
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

  await attachProcedimientoToMantenimiento(prisma, mantenimientoHero.id, procSplit.id);
  await prisma.mantenimiento.update({
    where: { id: mantenimientoHero.id },
    data: { resultadoInspeccion: ResultadoInspeccion.PASS },
  });
  await prisma.procedimientoItemRespuesta.updateMany({
    where: { mantenimientoId: mantenimientoHero.id },
    data: { completado: true },
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

  const mantenimientosVinculados = await prisma.mantenimiento.findMany({
    where: { id: { not: mantenimientoHero.id } },
    include: { equipo: { select: { tipoEquipo: true } } },
  });

  for (const m of mantenimientosVinculados) {
    const proc = procedimientoPorTipo[m.equipo.tipoEquipo] ?? procGeneral;
    await attachProcedimientoToMantenimiento(prisma, m.id, proc.id);
  }

  const chillerMant = mantenimientosVinculados.find(
    (m) => m.equipo.tipoEquipo === TipoEquipo.CHILLER
  );
  if (chillerMant) {
    const chillerItems = await prisma.procedimientoItem.findMany({
      where: { procedimientoId: procChiller.id },
      orderBy: { orden: "asc" },
      take: 2,
    });
    await prisma.procedimientoItemRespuesta.updateMany({
      where: {
        mantenimientoId: chillerMant.id,
        procedimientoItemId: { in: chillerItems.map((i) => i.id) },
      },
      data: { completado: true },
    });
    await prisma.mantenimiento.update({
      where: { id: chillerMant.id },
      data: {
        resultadoInspeccion: ResultadoInspeccion.FLAG,
        proveedorId: proveedores["Trane Supply"].id,
      },
    });
  }

  const extractorMant = mantenimientosVinculados.find((m) =>
    m.titulo.includes("Reparación extractor")
  );
  if (extractorMant) {
    await prisma.mantenimiento.update({
      where: { id: extractorMant.id },
      data: { proveedorId: proveedores["Electromecánica Central SpA"].id },
    });
  }

  const manejadoraMant = mantenimientosVinculados.find((m) =>
    m.titulo.includes("PM mensual — Manejadora")
  );
  if (manejadoraMant) {
    await prisma.mantenimiento.update({
      where: { id: manejadoraMant.id },
      data: { proveedorId: proveedores["Carrier Parts LATAM"].id },
    });
  }

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
  console.log("- Usuarios demo: admin / tecnico / encargado @smartbreeze.local");
  console.log(`- ${equipos.length} equipos HVAC (referencia QR: SBI-0048)`);
  console.log(`- ${repuestosSeed.length} repuestos en inventario`);
  console.log(`- ${proveedoresData.length} proveedores HVAC vinculados a repuestos y mantenimientos`);
  console.log(`- ${medidoresSeed.length} medidores HVAC con historial de lecturas`);
  console.log("- 5 procedimientos HVAC (biblioteca de checklists)");
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
