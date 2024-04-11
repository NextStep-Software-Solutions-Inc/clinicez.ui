import React from "react";
import SubmitAndNext from "./SubmitAndNext";

export default function PaymentForm() {
  return (
    <>
      <h4>Payment</h4>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="cardNumber">Card Number</label>
          <input type="text" id="cardNumber" placeholder="Card Number" />
        </div>
        <div>
          <label htmlFor="cardName">Name on Card</label>
          <input type="text" id="cardName" placeholder="Name on Card" />
        </div>
        <div>
          <label htmlFor="expiryDate">Expiry Date</label>
          <input type="text" id="expiryDate" placeholder="Expiry Date" />
        </div>
        <div>
          <label htmlFor="cvv">CVV</label>
          <input type="text" id="cvv" placeholder="CVV" />
        </div>
      </div>


      <SubmitAndNext/>
    </>
  );
}
