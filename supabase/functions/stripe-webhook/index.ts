// Supabase Edge Function — Stripe Webhook
// URL de esta función: https://gjvaebwhngqmhtcgharm.supabase.co/functions/v1/stripe-webhook
//
// Variables de entorno necesarias en Supabase Dashboard → Edge Functions → Secrets:
//   STRIPE_SECRET_KEY       → tu clave secreta de Stripe (sk_live_...)
//   STRIPE_WEBHOOK_SECRET   → el secreto del webhook (whsec_...)
//   SUPABASE_URL            → se inyecta automáticamente
//   SUPABASE_SERVICE_ROLE_KEY → se inyecta automáticamente

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  // Verificar la firma del webhook
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
    );
  } catch (err) {
    console.error('Webhook signature error:', err);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  console.log(`Evento recibido: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // El user ID lo pasamos como client_reference_id al abrir el link de Stripe
      const userId = session.client_reference_id;
      const customerId = session.customer as string;

      if (userId) {
        const { error } = await supabase.rpc('activar_suscripcion', {
          p_user_id: userId,
          p_stripe_customer_id: customerId || null,
        });
        if (error) console.error('Error activando suscripción:', error);
        else console.log(`Suscripción activada para user ${userId}`);
      } else {
        console.warn('checkout.session sin client_reference_id — no se puede vincular usuario');
      }
      break;
    }

    case 'customer.subscription.deleted': {
      // Cuando cancela la suscripción
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      // Buscar el perfil por stripe_customer_id
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .limit(1);

      if (profiles && profiles.length > 0) {
        await supabase.rpc('cancelar_suscripcion', { p_user_id: profiles[0].id });
        console.log(`Suscripción cancelada para customer ${customerId}`);
      }
      break;
    }

    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
