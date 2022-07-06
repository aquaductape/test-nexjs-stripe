// This is a public sample test API key.
// Don’t submit any personally identifiable information in requests made with this key.

import _stripe from 'stripe';

// Log in to see your own test API key embedded in code samples.

const stripe = new _stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2020-08-27' });

export type TStripePurchaseContentMetadata = {
  contentId: string;
  email: string;
  isGuest: boolean;
  userId: string;
  siteOrigin: string;
};

export default (async function (req, res) {
  if (req.method.toUpperCase() === 'POST') {
    try {
      //       if (!user) {
      //         const {
      //           data: [transaction],
      //           error: transactionError,
      //         } = parseSB(
      //           await supabaseServer.from<definitions['Transaction']>('Transaction').select('*').match({
      //             content: contentId,
      //             email,
      //           }),
      //         );
      //
      //         if (transactionError) {
      //           console.log(transactionError);
      //         }
      //
      //         if (transaction) {
      //           return res.send({
      //             alreadyPurchased: true,
      //           });
      //         }
      //
      //         createPaymentCookie({ req, res, contentId, email });
      //       }

      console.log('CREATE_PAYMENT INTENT');
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 500,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      return res.status(500).json({ data: null, error: 'Failed' });
    }
    return;
  }

  return res.status(500).json({ data: null, error: 'Failed' });
});
