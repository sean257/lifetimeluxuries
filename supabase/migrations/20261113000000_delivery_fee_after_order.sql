-- Delivery fees are now agreed with the customer on WhatsApp after the order,
-- so the shop no longer shows or charges a fixed fee per delivery option.
--
-- place_order() still adds delivery_options.fee to the order total; with every
-- fee at 0, order totals equal the items subtotal. The dashboard's Settings
-- page no longer edits fees and saves 0 for every option.
--
-- Past orders keep the delivery_fee they were placed with.

update public.delivery_options set fee = 0 where fee <> 0;
