


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."es_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.perfiles
    where id = auth.uid()
      and rol = 'administrador'
      and deleted_at is null
  );
$$;


ALTER FUNCTION "public"."es_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_actualizar_peso_lote_preliminar"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_lote_id UUID;
BEGIN
    v_lote_id := COALESCE(NEW.preliminar_lote_id, OLD.preliminar_lote_id);

    UPDATE preliminar_lote
    SET peso_en_canales = (
        SELECT COALESCE(SUM(peso_total_lote), 0)
        -- Apuntamos a lotes_entrada
        FROM lotes_entrada 
        WHERE preliminar_lote_id = v_lote_id
    )
    WHERE id = v_lote_id;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."fn_actualizar_peso_lote_preliminar"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_actualizar_stock_compra"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE productos
    SET stock_actual = stock_actual + NEW.cantidad
    WHERE id = NEW.producto_id;

    INSERT INTO inventario_log (producto_id, cantidad, tipo_movimiento, referencia_id)
    VALUES (NEW.producto_id, NEW.cantidad, 'compra', NEW.compra_id);

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_actualizar_stock_compra"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_actualizar_stock_despiece"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE productos
    SET stock_actual = stock_actual + NEW.peso_obtenido
    WHERE id = NEW.producto_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_actualizar_stock_despiece"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_aplicar_ajuste_inventario"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Intentamos actualizar el stock en la sucursal específica
    -- Usamos UPSERT (INSERT ... ON CONFLICT) por si el producto aún no tiene registro en esa sucursal
    INSERT INTO stock_sucursal (sucursal_id, producto_id, stock_actual)
    VALUES (
        NEW.sucursal_id, 
        NEW.producto_id, 
        CASE WHEN NEW.tipo_ajuste = 'entrada' THEN NEW.cantidad_ajustada ELSE -NEW.cantidad_ajustada END
    )
    ON CONFLICT (sucursal_id, producto_id) 
    DO UPDATE SET 
        stock_actual = CASE 
            WHEN NEW.tipo_ajuste = 'entrada' THEN stock_sucursal.stock_actual + NEW.cantidad_ajustada
            ELSE stock_sucursal.stock_actual - NEW.cantidad_ajustada 
        END;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_aplicar_ajuste_inventario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_consumir_insumos"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE productos
    SET stock_actual = stock_actual - NEW.peso_utilizado
    WHERE id = NEW.producto_insumo_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_consumir_insumos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_crear_perfil_nuevo_usuario"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_nombre TEXT;
  v_rol TEXT;
  v_sucursal UUID;
BEGIN
  v_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre_completo', split_part(NEW.email, '@', 1));
  v_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'cajero');
  v_sucursal := NULLIF(NEW.raw_user_meta_data->>'sucursal_id', '')::uuid;

  INSERT INTO public.perfiles (id, nombre_completo, rol, sucursal_id)
  VALUES (NEW.id, v_nombre, v_rol, v_sucursal)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_crear_perfil_nuevo_usuario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_descontar_saldo_vales"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.metodo_pago = 'vale' THEN
        IF (SELECT saldo_vales_disponible FROM trabajadores WHERE id = NEW.trabajador_id) < NEW.total THEN
            RAISE EXCEPTION 'Saldo de vales insuficiente para este trabajador.';
        END IF;
        UPDATE trabajadores
        SET saldo_vales_disponible = saldo_vales_disponible - NEW.total
        WHERE id = NEW.trabajador_id;

        INSERT INTO vales_movimientos (trabajador_id, tipo_movimiento, monto, venta_id, referencia_nota)
        VALUES (NEW.trabajador_id, 'consumo', NEW.total, NEW.id, 'Compra en sucursal');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_descontar_saldo_vales"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_sumar_producto_final"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE productos
    SET stock_actual = stock_actual + NEW.peso_total_final
    WHERE id = NEW.producto_final_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_sumar_producto_final"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM perfiles
    WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'administrador'
      AND perfiles.deleted_at IS NULL
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validar_limite_canales"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_cerdos integer;
  v_canales_previos integer;
  v_maximo integer;
BEGIN
  IF NEW.preliminar_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT cantidad_cerdo_en_pie INTO v_cerdos
  FROM preliminar_lote
  WHERE id = NEW.preliminar_lote_id;

  IF v_cerdos IS NULL THEN
    RAISE EXCEPTION 'El lote preliminar referenciado no existe.';
  END IF;

  v_maximo := v_cerdos * 2;

  SELECT COALESCE(SUM(cantidad_canales), 0) INTO v_canales_previos
  FROM lotes_entrada
  WHERE preliminar_lote_id = NEW.preliminar_lote_id
    AND id IS DISTINCT FROM NEW.id;

  IF v_canales_previos + NEW.cantidad_canales > v_maximo THEN
    RAISE EXCEPTION
      'Excede el límite de canales: máximo % (cerdos % x 2), ya hay % capturados y este registro agrega %.',
      v_maximo, v_cerdos, v_canales_previos, NEW.cantidad_canales;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validar_limite_canales"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ajustes_inventario" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sucursal_id" "uuid",
    "usuario_id" "uuid",
    "producto_id" "uuid",
    "turno_id" "uuid",
    "tipo_ajuste" "text",
    "motivo" "text",
    "cantidad_ajustada" numeric(12,2) NOT NULL,
    "observaciones" "text",
    "fecha_ajuste" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ajustes_inventario_motivo_check" CHECK (("motivo" = ANY (ARRAY['merma'::"text", 'robo'::"text", 'error_conteo'::"text", 'donacion'::"text", 'otro'::"text"]))),
    CONSTRAINT "ajustes_inventario_tipo_ajuste_check" CHECK (("tipo_ajuste" = ANY (ARRAY['entrada'::"text", 'salida'::"text"])))
);


ALTER TABLE "public"."ajustes_inventario" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre_negocio" "text",
    "nombre_contacto" "text" NOT NULL,
    "rfc" "text",
    "telefono" "text",
    "email" "text",
    "es_mayorista" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compra_detalles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "compra_id" "uuid",
    "producto_id" "uuid",
    "cantidad" numeric(12,2) NOT NULL,
    "costo_unitario" numeric(12,2) NOT NULL,
    "subtotal" numeric(12,2) GENERATED ALWAYS AS (("cantidad" * "costo_unitario")) STORED
);


ALTER TABLE "public"."compra_detalles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compras_proveedor" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proveedor_id" "uuid",
    "sucursal_id" "uuid",
    "folio_factura" "text",
    "monto_total" numeric(12,2) NOT NULL,
    "estado_pago" "text",
    "fecha_compra" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "compras_proveedor_estado_pago_check" CHECK (("estado_pago" = ANY (ARRAY['pendiente'::"text", 'pagado'::"text", 'parcial'::"text"])))
);


ALTER TABLE "public"."compras_proveedor" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cortes_caja" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "turno_id" "uuid" NOT NULL,
    "sucursal_id" "uuid",
    "usuario_id" "uuid",
    "ventas_efectivo" numeric(12,2) DEFAULT 0,
    "ventas_tarjeta" numeric(12,2) DEFAULT 0,
    "ventas_vales" numeric(12,2) DEFAULT 0,
    "total_egresos" numeric(12,2) DEFAULT 0,
    "saldo_esperado" numeric(12,2),
    "saldo_real" numeric(12,2) NOT NULL,
    "diferencia" numeric(12,2) GENERATED ALWAYS AS (("saldo_real" - "saldo_esperado")) STORED,
    "observaciones" "text",
    "fecha_corte" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cortes_caja" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."datos_facturacion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cliente_id" "uuid",
    "razon_social" "text" NOT NULL,
    "rfc" "text" NOT NULL,
    "regimen_fiscal" "text",
    "codigo_postal" "text",
    "uso_cfdi" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."datos_facturacion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."despiece_lote" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lote_id" "uuid",
    "producto_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "peso_bruto" numeric(12,3),
    "tara_id" "uuid",
    "peso_tara" numeric(12,3) DEFAULT 0,
    "peso_obtenido" numeric(12,3) GENERATED ALWAYS AS (("peso_bruto" - "peso_tara")) STORED
);


ALTER TABLE "public"."despiece_lote" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."formulas_despiece" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "producto_padre_id" "uuid",
    "producto_hijo_id" "uuid",
    "porcentaje_merma_estimado" numeric(5,2)
);


ALTER TABLE "public"."formulas_despiece" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."insumos_proceso" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proceso_id" "uuid",
    "producto_insumo_id" "uuid",
    "peso_utilizado" numeric(12,2) NOT NULL
);


ALTER TABLE "public"."insumos_proceso" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventario_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "producto_id" "uuid",
    "sucursal_id" "uuid",
    "cantidad" numeric(12,2) NOT NULL,
    "tipo_movimiento" "text",
    "ajuste_id" "uuid",
    "turno_id" "uuid",
    "referencia_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "inventario_log_tipo_movimiento_check" CHECK (("tipo_movimiento" = ANY (ARRAY['compra'::"text", 'venta'::"text", 'despiece_entrada'::"text", 'despiece_salida'::"text", 'merma'::"text", 'ajuste'::"text"])))
);


ALTER TABLE "public"."inventario_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lotes_entrada" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha_recepcion" timestamp with time zone DEFAULT "now"(),
    "cantidad_canales" integer NOT NULL,
    "proveedor" "text",
    "notas" "text",
    "preliminar_lote_id" "uuid",
    "sucursal_id" "uuid",
    "pesos_canales" "jsonb",
    "capturado_por" "text",
    "peso_bruto" numeric(12,3),
    "tara_id" "uuid",
    "peso_tara" numeric(12,3) DEFAULT 0,
    "peso_total_lote" numeric(12,3) GENERATED ALWAYS AS (("peso_bruto" - "peso_tara")) STORED
);


ALTER TABLE "public"."lotes_entrada" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pagos_proveedores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "compra_id" "uuid",
    "monto_pagado" numeric(12,2) NOT NULL,
    "metodo_pago" "text",
    "fecha_pago" timestamp with time zone DEFAULT "now"(),
    "comprobante_url" "text",
    "turno_id" "uuid"
);


ALTER TABLE "public"."pagos_proveedores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."perfiles" (
    "id" "uuid" NOT NULL,
    "nombre_completo" "text",
    "rol" "text",
    "sucursal_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "perfiles_rol_check" CHECK (("rol" = ANY (ARRAY['super_administrador'::"text", 'administrador'::"text", 'cajero'::"text", 'tablajero'::"text"])))
);


ALTER TABLE "public"."perfiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."precios_especiales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cliente_id" "uuid",
    "producto_id" "uuid",
    "precio_especial" numeric(12,2) NOT NULL
);


ALTER TABLE "public"."precios_especiales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preliminar_lote" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fecha_compra" timestamp with time zone DEFAULT "now"(),
    "cantidad_cerdo_en_pie" integer NOT NULL,
    "peso_total_granja" numeric(12,2) NOT NULL,
    "costo_unitario" numeric(12,2) NOT NULL,
    "peso_promedio_pie" numeric(12,2) GENERATED ALWAYS AS (("peso_total_granja" / ("cantidad_cerdo_en_pie")::numeric)) STORED,
    "costo_total_lote" numeric(12,2) GENERATED ALWAYS AS (("costo_unitario" * "peso_total_granja")) STORED,
    "peso_en_canales" numeric(12,2) DEFAULT 0,
    "perdida_granja_a_canal" numeric(12,2) GENERATED ALWAYS AS (("peso_total_granja" - "peso_en_canales")) STORED,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "preliminar_lote_cantidad_cerdo_en_pie_check" CHECK (("cantidad_cerdo_en_pie" > 0))
);


ALTER TABLE "public"."preliminar_lote" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."procesos_despiece" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "producto_padre_id" "uuid",
    "cantidad_padre_usada" numeric(12,2) NOT NULL,
    "sucursal_id" "uuid",
    "responsable_id" "uuid",
    "fecha_proceso" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."procesos_despiece" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."procesos_elaboracion" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "producto_final_id" "uuid",
    "peso_total_final" numeric(12,2) NOT NULL,
    "fecha_proceso" timestamp with time zone DEFAULT "now"(),
    "responsable_id" "uuid"
);


ALTER TABLE "public"."procesos_elaboracion" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."productos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "codigo_barras" "text",
    "nombre" "text" NOT NULL,
    "categoria" "text",
    "unidad_medida" "text" DEFAULT 'kg'::"text",
    "precio_venta" numeric(12,2) NOT NULL,
    "es_insumo" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "sub_categoria" "text"
);


ALTER TABLE "public"."productos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proveedores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre_empresa" "text" NOT NULL,
    "contacto_nombre" "text",
    "rfc" "text",
    "telefono" "text",
    "categoria" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."proveedores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_sucursal" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sucursal_id" "uuid" NOT NULL,
    "producto_id" "uuid" NOT NULL,
    "stock_actual" numeric(12,2) DEFAULT 0,
    "punto_reorden" numeric(12,2) DEFAULT 0
);


ALTER TABLE "public"."stock_sucursal" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sucursales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "dirección" "text",
    "telefono" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."sucursales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."taras_catalogo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nombre" "text" NOT NULL,
    "peso" numeric(12,3) NOT NULL,
    "icono" "text",
    "sucursal_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."taras_catalogo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trabajadores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "numero_empleado" "text" NOT NULL,
    "nombre_completo" "text" NOT NULL,
    "puesto" "text",
    "sucursal_id" "uuid",
    "saldo_vales_disponible" numeric(12,2) DEFAULT 0.00,
    "limite_mensual" numeric(12,2),
    "activo" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trabajadores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."turnos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sucursal_id" "uuid",
    "usuario_id" "uuid",
    "estado" "text" DEFAULT 'abierto'::"text",
    "fecha_apertura" timestamp with time zone DEFAULT "now"(),
    "fecha_cierre" timestamp with time zone,
    "fondo_fijo_inicial" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "turnos_estado_check" CHECK (("estado" = ANY (ARRAY['abierto'::"text", 'cerrado'::"text"])))
);


ALTER TABLE "public"."turnos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vales_movimientos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trabajador_id" "uuid",
    "tipo_movimiento" "text",
    "monto" numeric(12,2) NOT NULL,
    "venta_id" "uuid",
    "referencia_nota" "text",
    "fecha_movimiento" timestamp with time zone DEFAULT "now"(),
    "turno_id" "uuid",
    CONSTRAINT "vales_movimientos_tipo_movimiento_check" CHECK (("tipo_movimiento" = ANY (ARRAY['carga'::"text", 'consumo'::"text"])))
);


ALTER TABLE "public"."vales_movimientos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."venta_detalles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "venta_id" "uuid",
    "producto_id" "uuid",
    "cantidad" numeric(12,2) NOT NULL,
    "precio_unitario" numeric(12,2) NOT NULL,
    "subtotal" numeric(12,2) GENERATED ALWAYS AS (("cantidad" * "precio_unitario")) STORED,
    "impuesto_iva" numeric(12,2) DEFAULT 0,
    "descuento" numeric(12,2) DEFAULT 0
);


ALTER TABLE "public"."venta_detalles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ventas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sucursal_id" "uuid",
    "vendedor_id" "uuid",
    "cliente_id" "uuid",
    "total" numeric(12,2) NOT NULL,
    "metodo_pago" "text" NOT NULL,
    "fecha_venta" timestamp with time zone DEFAULT "now"(),
    "turno_id" "uuid",
    "trabajador_id" "uuid",
    "requiere_factura" boolean DEFAULT false,
    "estado_facturacion" "text" DEFAULT 'no_facturado'::"text",
    "uuid_fiscal" "text",
    CONSTRAINT "ventas_metodo_pago_check" CHECK (("metodo_pago" = ANY (ARRAY['efectivo'::"text", 'tarjeta'::"text", 'transferencia'::"text", 'vale'::"text"])))
);


ALTER TABLE "public"."ventas" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ajustes_inventario"
    ADD CONSTRAINT "ajustes_inventario_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_rfc_key" UNIQUE ("rfc");



ALTER TABLE ONLY "public"."compra_detalles"
    ADD CONSTRAINT "compra_detalles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compras_proveedor"
    ADD CONSTRAINT "compras_proveedor_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cortes_caja"
    ADD CONSTRAINT "cortes_caja_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cortes_caja"
    ADD CONSTRAINT "cortes_caja_turno_id_key" UNIQUE ("turno_id");



ALTER TABLE ONLY "public"."datos_facturacion"
    ADD CONSTRAINT "datos_facturacion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."despiece_lote"
    ADD CONSTRAINT "despiece_lote_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formulas_despiece"
    ADD CONSTRAINT "formulas_despiece_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formulas_despiece"
    ADD CONSTRAINT "formulas_despiece_producto_padre_id_producto_hijo_id_key" UNIQUE ("producto_padre_id", "producto_hijo_id");



ALTER TABLE ONLY "public"."insumos_proceso"
    ADD CONSTRAINT "insumos_proceso_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventario_log"
    ADD CONSTRAINT "inventario_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lotes_entrada"
    ADD CONSTRAINT "lotes_entrada_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pagos_proveedores"
    ADD CONSTRAINT "pagos_proveedores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."precios_especiales"
    ADD CONSTRAINT "precios_especiales_cliente_id_producto_id_key" UNIQUE ("cliente_id", "producto_id");



ALTER TABLE ONLY "public"."precios_especiales"
    ADD CONSTRAINT "precios_especiales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preliminar_lote"
    ADD CONSTRAINT "preliminar_lote_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."procesos_despiece"
    ADD CONSTRAINT "procesos_despiece_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."procesos_elaboracion"
    ADD CONSTRAINT "procesos_elaboracion_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_codigo_barras_key" UNIQUE ("codigo_barras");



ALTER TABLE ONLY "public"."productos"
    ADD CONSTRAINT "productos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proveedores"
    ADD CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_sucursal"
    ADD CONSTRAINT "stock_sucursal_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_sucursal"
    ADD CONSTRAINT "stock_sucursal_sucursal_id_producto_id_key" UNIQUE ("sucursal_id", "producto_id");



ALTER TABLE ONLY "public"."sucursales"
    ADD CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."taras_catalogo"
    ADD CONSTRAINT "taras_catalogo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trabajadores"
    ADD CONSTRAINT "trabajadores_numero_empleado_key" UNIQUE ("numero_empleado");



ALTER TABLE ONLY "public"."trabajadores"
    ADD CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."turnos"
    ADD CONSTRAINT "turnos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vales_movimientos"
    ADD CONSTRAINT "vales_movimientos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."venta_detalles"
    ADD CONSTRAINT "venta_detalles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_perfiles_deleted_at" ON "public"."perfiles" USING "btree" ("deleted_at");



CREATE OR REPLACE TRIGGER "fn_validar_limite_canales" BEFORE INSERT OR UPDATE OF "cantidad_canales", "preliminar_lote_id" ON "public"."lotes_entrada" FOR EACH ROW EXECUTE FUNCTION "public"."validar_limite_canales"();



CREATE OR REPLACE TRIGGER "tr_consumo_insumos" AFTER INSERT ON "public"."insumos_proceso" FOR EACH ROW EXECUTE FUNCTION "public"."fn_consumir_insumos"();



CREATE OR REPLACE TRIGGER "tr_entrada_compra" AFTER INSERT ON "public"."compra_detalles" FOR EACH ROW EXECUTE FUNCTION "public"."fn_actualizar_stock_compra"();



CREATE OR REPLACE TRIGGER "tr_procesar_ajuste" AFTER INSERT ON "public"."ajustes_inventario" FOR EACH ROW EXECUTE FUNCTION "public"."fn_aplicar_ajuste_inventario"();



CREATE OR REPLACE TRIGGER "tr_procesar_pago_vale" AFTER INSERT ON "public"."ventas" FOR EACH ROW EXECUTE FUNCTION "public"."fn_descontar_saldo_vales"();



CREATE OR REPLACE TRIGGER "tr_sincronizar_peso_canales" AFTER INSERT OR DELETE OR UPDATE ON "public"."lotes_entrada" FOR EACH ROW EXECUTE FUNCTION "public"."fn_actualizar_peso_lote_preliminar"();



CREATE OR REPLACE TRIGGER "tr_stock_despiece" AFTER INSERT ON "public"."despiece_lote" FOR EACH ROW EXECUTE FUNCTION "public"."fn_actualizar_stock_despiece"();



CREATE OR REPLACE TRIGGER "tr_suma_procesado" AFTER INSERT ON "public"."procesos_elaboracion" FOR EACH ROW EXECUTE FUNCTION "public"."fn_sumar_producto_final"();



ALTER TABLE ONLY "public"."ajustes_inventario"
    ADD CONSTRAINT "ajustes_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."ajustes_inventario"
    ADD CONSTRAINT "ajustes_inventario_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."ajustes_inventario"
    ADD CONSTRAINT "ajustes_inventario_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ajustes_inventario"
    ADD CONSTRAINT "ajustes_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."perfiles"("id");



ALTER TABLE ONLY "public"."compra_detalles"
    ADD CONSTRAINT "compra_detalles_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "public"."compras_proveedor"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compra_detalles"
    ADD CONSTRAINT "compra_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."compras_proveedor"
    ADD CONSTRAINT "compras_proveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id");



ALTER TABLE ONLY "public"."compras_proveedor"
    ADD CONSTRAINT "compras_proveedor_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."cortes_caja"
    ADD CONSTRAINT "cortes_caja_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."cortes_caja"
    ADD CONSTRAINT "cortes_caja_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cortes_caja"
    ADD CONSTRAINT "cortes_caja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."perfiles"("id");



ALTER TABLE ONLY "public"."datos_facturacion"
    ADD CONSTRAINT "datos_facturacion_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."despiece_lote"
    ADD CONSTRAINT "despiece_lote_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "public"."lotes_entrada"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."despiece_lote"
    ADD CONSTRAINT "despiece_lote_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."despiece_lote"
    ADD CONSTRAINT "despiece_lote_tara_id_fkey" FOREIGN KEY ("tara_id") REFERENCES "public"."taras_catalogo"("id");



ALTER TABLE ONLY "public"."formulas_despiece"
    ADD CONSTRAINT "formulas_despiece_producto_hijo_id_fkey" FOREIGN KEY ("producto_hijo_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."formulas_despiece"
    ADD CONSTRAINT "formulas_despiece_producto_padre_id_fkey" FOREIGN KEY ("producto_padre_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."insumos_proceso"
    ADD CONSTRAINT "insumos_proceso_proceso_id_fkey" FOREIGN KEY ("proceso_id") REFERENCES "public"."procesos_elaboracion"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."insumos_proceso"
    ADD CONSTRAINT "insumos_proceso_producto_insumo_id_fkey" FOREIGN KEY ("producto_insumo_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."inventario_log"
    ADD CONSTRAINT "inventario_log_ajuste_id_fkey" FOREIGN KEY ("ajuste_id") REFERENCES "public"."ajustes_inventario"("id");



ALTER TABLE ONLY "public"."inventario_log"
    ADD CONSTRAINT "inventario_log_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."inventario_log"
    ADD CONSTRAINT "inventario_log_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."inventario_log"
    ADD CONSTRAINT "inventario_log_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos"("id");



ALTER TABLE ONLY "public"."lotes_entrada"
    ADD CONSTRAINT "lotes_entrada_preliminar_lote_id_fkey" FOREIGN KEY ("preliminar_lote_id") REFERENCES "public"."preliminar_lote"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lotes_entrada"
    ADD CONSTRAINT "lotes_entrada_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."lotes_entrada"
    ADD CONSTRAINT "lotes_entrada_tara_id_fkey" FOREIGN KEY ("tara_id") REFERENCES "public"."taras_catalogo"("id");



ALTER TABLE ONLY "public"."pagos_proveedores"
    ADD CONSTRAINT "pagos_proveedores_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "public"."compras_proveedor"("id");



ALTER TABLE ONLY "public"."pagos_proveedores"
    ADD CONSTRAINT "pagos_proveedores_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos"("id");



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."perfiles"
    ADD CONSTRAINT "perfiles_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."precios_especiales"
    ADD CONSTRAINT "precios_especiales_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id");



ALTER TABLE ONLY "public"."precios_especiales"
    ADD CONSTRAINT "precios_especiales_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."procesos_despiece"
    ADD CONSTRAINT "procesos_despiece_producto_padre_id_fkey" FOREIGN KEY ("producto_padre_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."procesos_despiece"
    ADD CONSTRAINT "procesos_despiece_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "public"."perfiles"("id");



ALTER TABLE ONLY "public"."procesos_despiece"
    ADD CONSTRAINT "procesos_despiece_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."procesos_elaboracion"
    ADD CONSTRAINT "procesos_elaboracion_producto_final_id_fkey" FOREIGN KEY ("producto_final_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."procesos_elaboracion"
    ADD CONSTRAINT "procesos_elaboracion_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "public"."perfiles"("id");



ALTER TABLE ONLY "public"."stock_sucursal"
    ADD CONSTRAINT "stock_sucursal_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_sucursal"
    ADD CONSTRAINT "stock_sucursal_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."taras_catalogo"
    ADD CONSTRAINT "taras_catalogo_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trabajadores"
    ADD CONSTRAINT "trabajadores_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."turnos"
    ADD CONSTRAINT "turnos_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."turnos"
    ADD CONSTRAINT "turnos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."perfiles"("id");



ALTER TABLE ONLY "public"."vales_movimientos"
    ADD CONSTRAINT "vales_movimientos_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "public"."trabajadores"("id");



ALTER TABLE ONLY "public"."vales_movimientos"
    ADD CONSTRAINT "vales_movimientos_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos"("id");



ALTER TABLE ONLY "public"."vales_movimientos"
    ADD CONSTRAINT "vales_movimientos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id");



ALTER TABLE ONLY "public"."venta_detalles"
    ADD CONSTRAINT "venta_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id");



ALTER TABLE ONLY "public"."venta_detalles"
    ADD CONSTRAINT "venta_detalles_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id");



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id");



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "public"."trabajadores"("id");



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "public"."turnos"("id");



ALTER TABLE ONLY "public"."ventas"
    ADD CONSTRAINT "ventas_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "public"."perfiles"("id");



ALTER TABLE "public"."ajustes_inventario" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compra_detalles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compras_proveedor" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cortes_caja" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."datos_facturacion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."despiece_lote" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."formulas_despiece" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."insumos_proceso" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventario_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lotes_entrada" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lotes_entrada_insert" ON "public"."lotes_entrada" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "lotes_entrada_select" ON "public"."lotes_entrada" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "lotes_entrada_update" ON "public"."lotes_entrada" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."pagos_proveedores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."perfiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "perfiles_select" ON "public"."perfiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."es_admin"()));



CREATE POLICY "perfiles_update_admin" ON "public"."perfiles" FOR UPDATE TO "authenticated" USING ("public"."es_admin"()) WITH CHECK ("public"."es_admin"());



ALTER TABLE "public"."precios_especiales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preliminar_lote" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "preliminar_lote_insert_admin" ON "public"."preliminar_lote" FOR INSERT TO "authenticated" WITH CHECK ("public"."es_admin"());



CREATE POLICY "preliminar_lote_select" ON "public"."preliminar_lote" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "preliminar_lote_update_admin" ON "public"."preliminar_lote" FOR UPDATE TO "authenticated" USING ("public"."es_admin"()) WITH CHECK ("public"."es_admin"());



ALTER TABLE "public"."procesos_despiece" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."procesos_elaboracion" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."productos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "productos_insert_admin" ON "public"."productos" FOR INSERT TO "authenticated" WITH CHECK ("public"."es_admin"());



CREATE POLICY "productos_select" ON "public"."productos" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "productos_update" ON "public"."productos" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."proveedores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proveedores_insert_admin" ON "public"."proveedores" FOR INSERT TO "authenticated" WITH CHECK ("public"."es_admin"());



CREATE POLICY "proveedores_select" ON "public"."proveedores" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "proveedores_update_admin" ON "public"."proveedores" FOR UPDATE TO "authenticated" USING ("public"."es_admin"()) WITH CHECK ("public"."es_admin"());



ALTER TABLE "public"."stock_sucursal" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sucursales" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sucursales_insert_admin" ON "public"."sucursales" FOR INSERT TO "authenticated" WITH CHECK ("public"."es_admin"());



CREATE POLICY "sucursales_select" ON "public"."sucursales" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "sucursales_update_admin" ON "public"."sucursales" FOR UPDATE TO "authenticated" USING ("public"."es_admin"()) WITH CHECK ("public"."es_admin"());



ALTER TABLE "public"."taras_catalogo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trabajadores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."turnos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vales_movimientos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."venta_detalles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ventas" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."es_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."es_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."es_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_actualizar_peso_lote_preliminar"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_actualizar_peso_lote_preliminar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_actualizar_peso_lote_preliminar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_actualizar_stock_compra"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_actualizar_stock_compra"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_actualizar_stock_compra"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_actualizar_stock_despiece"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_actualizar_stock_despiece"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_actualizar_stock_despiece"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_aplicar_ajuste_inventario"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_aplicar_ajuste_inventario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_aplicar_ajuste_inventario"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_consumir_insumos"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_consumir_insumos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_consumir_insumos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_crear_perfil_nuevo_usuario"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_crear_perfil_nuevo_usuario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_crear_perfil_nuevo_usuario"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_descontar_saldo_vales"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_descontar_saldo_vales"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_descontar_saldo_vales"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_sumar_producto_final"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_sumar_producto_final"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_sumar_producto_final"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validar_limite_canales"() TO "anon";
GRANT ALL ON FUNCTION "public"."validar_limite_canales"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validar_limite_canales"() TO "service_role";


















GRANT ALL ON TABLE "public"."ajustes_inventario" TO "anon";
GRANT ALL ON TABLE "public"."ajustes_inventario" TO "authenticated";
GRANT ALL ON TABLE "public"."ajustes_inventario" TO "service_role";



GRANT ALL ON TABLE "public"."clientes" TO "anon";
GRANT ALL ON TABLE "public"."clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."clientes" TO "service_role";



GRANT ALL ON TABLE "public"."compra_detalles" TO "anon";
GRANT ALL ON TABLE "public"."compra_detalles" TO "authenticated";
GRANT ALL ON TABLE "public"."compra_detalles" TO "service_role";



GRANT ALL ON TABLE "public"."compras_proveedor" TO "anon";
GRANT ALL ON TABLE "public"."compras_proveedor" TO "authenticated";
GRANT ALL ON TABLE "public"."compras_proveedor" TO "service_role";



GRANT ALL ON TABLE "public"."cortes_caja" TO "anon";
GRANT ALL ON TABLE "public"."cortes_caja" TO "authenticated";
GRANT ALL ON TABLE "public"."cortes_caja" TO "service_role";



GRANT ALL ON TABLE "public"."datos_facturacion" TO "anon";
GRANT ALL ON TABLE "public"."datos_facturacion" TO "authenticated";
GRANT ALL ON TABLE "public"."datos_facturacion" TO "service_role";



GRANT ALL ON TABLE "public"."despiece_lote" TO "anon";
GRANT ALL ON TABLE "public"."despiece_lote" TO "authenticated";
GRANT ALL ON TABLE "public"."despiece_lote" TO "service_role";



GRANT ALL ON TABLE "public"."formulas_despiece" TO "anon";
GRANT ALL ON TABLE "public"."formulas_despiece" TO "authenticated";
GRANT ALL ON TABLE "public"."formulas_despiece" TO "service_role";



GRANT ALL ON TABLE "public"."insumos_proceso" TO "anon";
GRANT ALL ON TABLE "public"."insumos_proceso" TO "authenticated";
GRANT ALL ON TABLE "public"."insumos_proceso" TO "service_role";



GRANT ALL ON TABLE "public"."inventario_log" TO "anon";
GRANT ALL ON TABLE "public"."inventario_log" TO "authenticated";
GRANT ALL ON TABLE "public"."inventario_log" TO "service_role";



GRANT ALL ON TABLE "public"."lotes_entrada" TO "anon";
GRANT ALL ON TABLE "public"."lotes_entrada" TO "authenticated";
GRANT ALL ON TABLE "public"."lotes_entrada" TO "service_role";



GRANT ALL ON TABLE "public"."pagos_proveedores" TO "anon";
GRANT ALL ON TABLE "public"."pagos_proveedores" TO "authenticated";
GRANT ALL ON TABLE "public"."pagos_proveedores" TO "service_role";



GRANT ALL ON TABLE "public"."perfiles" TO "anon";
GRANT ALL ON TABLE "public"."perfiles" TO "authenticated";
GRANT ALL ON TABLE "public"."perfiles" TO "service_role";



GRANT ALL ON TABLE "public"."precios_especiales" TO "anon";
GRANT ALL ON TABLE "public"."precios_especiales" TO "authenticated";
GRANT ALL ON TABLE "public"."precios_especiales" TO "service_role";



GRANT ALL ON TABLE "public"."preliminar_lote" TO "anon";
GRANT ALL ON TABLE "public"."preliminar_lote" TO "authenticated";
GRANT ALL ON TABLE "public"."preliminar_lote" TO "service_role";



GRANT ALL ON TABLE "public"."procesos_despiece" TO "anon";
GRANT ALL ON TABLE "public"."procesos_despiece" TO "authenticated";
GRANT ALL ON TABLE "public"."procesos_despiece" TO "service_role";



GRANT ALL ON TABLE "public"."procesos_elaboracion" TO "anon";
GRANT ALL ON TABLE "public"."procesos_elaboracion" TO "authenticated";
GRANT ALL ON TABLE "public"."procesos_elaboracion" TO "service_role";



GRANT ALL ON TABLE "public"."productos" TO "anon";
GRANT ALL ON TABLE "public"."productos" TO "authenticated";
GRANT ALL ON TABLE "public"."productos" TO "service_role";



GRANT ALL ON TABLE "public"."proveedores" TO "anon";
GRANT ALL ON TABLE "public"."proveedores" TO "authenticated";
GRANT ALL ON TABLE "public"."proveedores" TO "service_role";



GRANT ALL ON TABLE "public"."stock_sucursal" TO "anon";
GRANT ALL ON TABLE "public"."stock_sucursal" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_sucursal" TO "service_role";



GRANT ALL ON TABLE "public"."sucursales" TO "anon";
GRANT ALL ON TABLE "public"."sucursales" TO "authenticated";
GRANT ALL ON TABLE "public"."sucursales" TO "service_role";



GRANT ALL ON TABLE "public"."taras_catalogo" TO "anon";
GRANT ALL ON TABLE "public"."taras_catalogo" TO "authenticated";
GRANT ALL ON TABLE "public"."taras_catalogo" TO "service_role";



GRANT ALL ON TABLE "public"."trabajadores" TO "anon";
GRANT ALL ON TABLE "public"."trabajadores" TO "authenticated";
GRANT ALL ON TABLE "public"."trabajadores" TO "service_role";



GRANT ALL ON TABLE "public"."turnos" TO "anon";
GRANT ALL ON TABLE "public"."turnos" TO "authenticated";
GRANT ALL ON TABLE "public"."turnos" TO "service_role";



GRANT ALL ON TABLE "public"."vales_movimientos" TO "anon";
GRANT ALL ON TABLE "public"."vales_movimientos" TO "authenticated";
GRANT ALL ON TABLE "public"."vales_movimientos" TO "service_role";



GRANT ALL ON TABLE "public"."venta_detalles" TO "anon";
GRANT ALL ON TABLE "public"."venta_detalles" TO "authenticated";
GRANT ALL ON TABLE "public"."venta_detalles" TO "service_role";



GRANT ALL ON TABLE "public"."ventas" TO "anon";
GRANT ALL ON TABLE "public"."ventas" TO "authenticated";
GRANT ALL ON TABLE "public"."ventas" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































