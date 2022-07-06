import {
  Elements,
  PaymentElement,
  PaymentRequestButtonElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { CanMakePaymentResult, loadStripe } from '@stripe/stripe-js';
import { useEffect, useLayoutEffect, useState } from 'react';

type TPaymentButton = {
  name: string;
  width: number;
  selected: boolean;
  img?: string;
  loading?: boolean;
};

// I don't think it's possible to add both Google and Apple Pay at the same time
// https://stackoverflow.com/questions/65648609/how-to-add-google-pay-and-apple-pay-options-to-stripe-checkout-when-session-mode
const NeedToPurchase = () => {
  return (
    <>
      <StripeInstanceForm />
    </>
  );
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const StripeInstanceForm = () => {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    const run = async () => {
      // Create PaymentIntent as soon as the page loads
      const response = await fetch('/api/stripe/createPaymentIntent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (data.alreadyPurchased) {
        return;
      }

      setClientSecret(data.clientSecret);
    };

    run();
  }, []);

  const appearance = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
  };
  return (
    <>
      {clientSecret && (
        <Elements options={options as any} stripe={stripePromise}>
          <StripeCheckoutForm />
        </Elements>
      )}
    </>
  );
};

const StripeCheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIfPurchased, setIsCheckingIfPurchased] = useState(true);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret',
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Payment succeeded!');
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          break;
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${location.href}`,
        // return_url: '',
      },
    });

    console.log({ error });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message);
    } else {
      setMessage('An unexpected error occured.');
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" />
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="bg-white border-black border-2 rounded-[10px] w-full py-4 px-8 font-semibold mt-5 hover:bg-black hover:text-white transition"
      >
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : `Pay 500`}
        </span>
      </button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
};

export default NeedToPurchase;
