import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import type { Address, CheckoutInit } from '@/types'
import { formatPrice } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  IconBack,
  IconCheck,
  IconChevronRight,
  IconLock,
  IconMapPin,
  IconPlus,
  IconTrash,
  IconTruck,
} from '@/components/ui/icons'

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Australia', 'Canada']

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
  { id: 'upi', label: 'UPI', desc: 'Pay via any UPI app (GPay, PhonePe, Paytm)' },
  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay, Amex' },
  { id: 'netbanking', label: 'Net Banking', desc: 'All major Indian banks' },
]

const NETBANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank']

const STEPS = ['Address', 'Payment', 'Review']

interface AddressFormState {
  full_name: string
  phone: string
  email: string
  house: string
  city: string
  state: string
  pin_code: string
  country: string
}

const EMPTY_FORM: AddressFormState = {
  full_name: '',
  phone: '',
  email: '',
  house: '',
  city: '',
  state: '',
  pin_code: '',
  country: 'India',
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { refreshCart } = useCart()

  const [step, setStep] = useState(1)
  const [checkout, setCheckout] = useState<CheckoutInit | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [addressLoading, setAddressLoading] = useState(false)
  const [placing, setPlacing] = useState(false)

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null)
  const [addingAddress, setAddingAddress] = useState(false)
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [upiId, setUpiId] = useState('')
  const [netBank, setNetBank] = useState(NETBANKS[0])
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    let active = true
    api
      .initCheckout()
      .then((res) => {
        if (!active) return
        setCheckout(res.data)
      })
      .catch(() => {
        if (!active) return
        setCheckout(null)
      })

    api
      .getAddresses()
      .then((res) => {
        if (!active) return
        setAddresses(res.data)
        const def = res.data.find((a) => a.is_default === 1)
        if (def) setSelectedAddress(def.id)
        else if (res.data.length === 1) setSelectedAddress(res.data[0].id)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const selectedAddr = useMemo(() => addresses.find((a) => a.id === selectedAddress) || null, [addresses, selectedAddress])

  const updateForm = (key: keyof AddressFormState, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const validateForm = useCallback(() => {
    if (!form.full_name.trim()) return 'Full name is required'
    if (!form.phone.trim()) return 'Phone number is required'
    if (form.phone.replace(/\D/g, '').length < 10) return 'Enter a valid phone number'
    if (!form.house.trim()) return 'Address is required'
    if (!form.city.trim()) return 'City is required'
    if (!form.state.trim()) return 'State is required'
    if (!form.pin_code.trim()) return 'PIN code is required'
    if (form.pin_code.replace(/\D/g, '').length !== 6) return 'Enter a valid 6-digit PIN code'
    return ''
  }, [form])

  const saveAddress = async () => {
    const error = validateForm()
    if (error) {
      setFormError(error)
      return
    }
    setAddressLoading(true)
    setFormError('')
    try {
      const res = await api.createAddress({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        house: form.house.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pin_code: form.pin_code.trim(),
        country: form.country,
        is_default: addresses.length === 0 ? 1 : 0,
      })
      setAddresses((prev) => [...prev, res.data])
      setSelectedAddress(res.data.id)
      setAddingAddress(false)
      setForm(EMPTY_FORM)
      toast('Address added')
    } catch (e: any) {
      setFormError(e?.message || 'Could not save address')
    } finally {
      setAddressLoading(false)
    }
  }

  const deleteAddress = async (id: number) => {
    try {
      await api.deleteAddress(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      if (selectedAddress === id) setSelectedAddress(null)
      toast('Address removed', 'info')
    } catch (e: any) {
      toast(e?.message || 'Could not delete address', 'error')
    }
  }

  const gotoStep = (target: number) => {
    if (target === 2 && !selectedAddr) {
      setStep(1)
      toast('Please select a delivery address', 'error')
      return
    }
    setStep(target)
    window.scrollTo(0, 0)
  }

  const cardComplete =
    /^\d{16}$/.test(cardNumber.replace(/\s/g, '')) &&
    cardName.trim().length > 0 &&
    /^\d{2}\/\d{2}$/.test(cardExpiry) &&
    /^\d{3,4}$/.test(cardCvv)

  const getGateway = () => {
    if (paymentMethod === 'cod') return undefined
    if (paymentMethod === 'upi') return `upi:${upiId}`
    if (paymentMethod === 'card') return `card:${cardNumber.replace(/\s/g, '')}`
    return `bank:${netBank}`
  }

  const validatePayment = () => {
    if (paymentMethod === 'upi' && !upiId.trim()) return 'Enter your UPI ID'
    if (paymentMethod === 'upi' && !upiId.includes('@')) return 'Enter a valid UPI ID'
    if (paymentMethod === 'card' && !cardComplete) return 'Please fill in all card details'
    return ''
  }

  const placeOrder = async () => {
    const paymentError = validatePayment()
    if (paymentError) {
      toast(paymentError, 'error')
      return
    }
    if (!selectedAddr) {
      toast('Please select a delivery address', 'error')
      return
    }
    setPlacing(true)
    try {
      const res = await api.placeOrder({
        address_id: selectedAddr.id,
        payment_method: paymentMethod,
        payment_gateway: getGateway(),
        remarks: remarks.trim() || undefined,
      })
      toast(res.message || 'Order placed!')
      refreshCart()
      navigate(`/order-success/${res.data.order_id}`, { state: { orderNumber: res.data.order_number, total: res.data.total } })
    } catch (e: any) {
      toast(e?.message || 'Could not place order', 'error')
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="container-shopx flex min-h-[60vh] items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!checkout) {
    return (
      <div className="container-shopx py-12">
        <EmptyState
          icon={<IconTruck className="h-10 w-10" />}
          title="Your cart is empty"
          description="Add some products to your cart before checking out."
          action={<Link to="/products" className="btn-primary">Browse products</Link>}
        />
      </div>
    )
  }

  return (
    <div className="container-shopx py-6 sm:py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/cart" className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 hover:bg-ink-50">
          <IconBack className="h-4.5 w-4.5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-ink-900 sm:text-2xl">Checkout</h1>
          <p className="text-xs text-ink-500 sm:text-sm">Almost there — review and place your order</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="mb-8 flex items-center">
        {STEPS.map((label, i) => {
          const n = i + 1
          const active = n === step
          const done = n < step
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <button
                onClick={() => (done ? gotoStep(n) : {})}
                className={`flex items-center gap-2 ${done ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400'
                  }`}
                >
                  {done ? <IconCheck className="h-4 w-4" /> : n}
                </span>
                <span className={`hidden text-sm font-semibold sm:block ${active ? 'text-ink-900' : done ? 'text-emerald-600' : 'text-ink-400'}`}>
                  {label}
                </span>
              </button>
              {n < STEPS.length && (
                <div className={`mx-3 h-0.5 flex-1 rounded ${done ? 'bg-emerald-500' : active ? 'bg-brand-300' : 'bg-ink-100'}`} />
              )}
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {step === 1 && (
            <section className="card overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                  <IconMapPin className="h-5 w-5 text-brand-600" />
                  Delivery Address
                </h2>
              </div>
              <div className="space-y-3 p-5">
                {addresses.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAddress(a.id)}
                        className={`relative rounded-2xl border p-4 text-left transition-all ${
                          selectedAddress === a.id
                            ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/30'
                            : 'border-ink-200 bg-white hover:border-brand-300'
                        }`}
                      >
                        {selectedAddress === a.id && (
                          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                            <IconCheck className="h-3 w-3" />
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-ink-900">{a.full_name}</p>
                          {a.is_default === 1 && <span className="badge bg-emerald-100 text-emerald-700">Default</span>}
                        </div>
                        <p className="mt-1 text-xs text-ink-500">{a.phone}</p>
                        <p className="mt-2 text-sm leading-relaxed text-ink-600">
                          {a.house}, {a.city}, {a.state} — {a.pin_code}
                        </p>
                        <p className="mt-1 text-xs text-ink-400">{a.country}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteAddress(a.id)
                          }}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          <IconTrash className="h-3.5 w-3.5" /> Remove
                        </button>
                      </button>
                    ))}
                  </div>
                )}

                {addingAddress ? (
                  <div className="rounded-2xl border border-brand-300 bg-brand-50/40 p-4 sm:p-5">
                    <h3 className="mb-4 text-sm font-bold text-ink-900">Add new address</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Full name</label>
                        <input className="input" value={form.full_name} onChange={(e) => updateForm('full_name', e.target.value)} placeholder="Name" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Phone</label>
                          <input className="input" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="10-digit" inputMode="numeric" />
                        </div>
                        <div>
                          <label className="label">Email (opt.)</label>
                          <input className="input" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="Email" />
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Address (House no, Street, Area)</label>
                        <input className="input" value={form.house} onChange={(e) => updateForm('house', e.target.value)} placeholder="Flat / House no, Street, Locality" />
                      </div>
                      <div>
                        <label className="label">City</label>
                        <input className="input" value={form.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="City" />
                      </div>
                      <div>
                        <label className="label">State</label>
                        <input className="input" value={form.state} onChange={(e) => updateForm('state', e.target.value)} placeholder="State" />
                      </div>
                      <div>
                        <label className="label">PIN code</label>
                        <input className="input" value={form.pin_code} onChange={(e) => updateForm('pin_code', e.target.value)} placeholder="6-digit" inputMode="numeric" />
                      </div>
                      <div>
                        <label className="label">Country</label>
                        <select className="input" value={form.country} onChange={(e) => updateForm('country', e.target.value)}>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {formError && <p className="mt-3 text-sm font-medium text-red-600">{formError}</p>}
                    <div className="mt-4 flex gap-3">
                      <button className="btn-primary" onClick={saveAddress} disabled={addressLoading}>
                        {addressLoading ? 'Saving…' : 'Save address'}
                      </button>
                      <button className="btn-ghost" onClick={() => { setAddingAddress(false); setFormError('') }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-white p-4 text-sm font-semibold text-brand-600 hover:border-brand-400 hover:bg-brand-50/40" onClick={() => setAddingAddress(true)}>
                    <IconPlus className="h-4 w-4" /> Add new address
                  </button>
                )}

                <div className="flex justify-end pt-2">
                  <button className="btn-primary" onClick={() => gotoStep(2)} disabled={!selectedAddr}>
                    Continue to payment <IconChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="card overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                  <IconLock className="h-5 w-5 text-brand-600" />
                  Payment Method
                </h2>
              </div>
              <div className="p-5">
                <div className="mb-4 rounded-2xl bg-ink-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Delivering to</p>
                  <p className="mt-1 text-sm font-bold text-ink-900">{selectedAddr?.full_name}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{selectedAddr?.house}, {selectedAddr?.city}, {selectedAddr?.state} — {selectedAddr?.pin_code}</p>
                </div>

                <div className="space-y-2.5">
                  {PAYMENT_METHODS.map((m) => (
                    <div key={m.id}>
                      <button
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                          paymentMethod === m.id ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/30' : 'border-ink-200 bg-white hover:border-brand-300'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-ink-900">{m.label}</p>
                          <p className="mt-0.5 text-xs text-ink-500">{m.desc}</p>
                        </div>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${paymentMethod === m.id ? 'border-brand-600' : 'border-ink-300'}`}>
                          {paymentMethod === m.id && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                        </span>
                      </button>
                      {paymentMethod === m.id && (
                        <div className="mt-2 rounded-b-2xl border border-t-0 border-ink-200 bg-white p-4 animate-slide-down">
                          {m.id === 'card' && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <label className="label">Card number (for demo only)</label>
                                <input
                                  className="input font-mono"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, '').slice(0, 19))}
                                  placeholder="1234 5678 9012 3456"
                                  inputMode="numeric"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="label">Name on card</label>
                                <input className="input" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Full name" />
                              </div>
                              <div>
                                <label className="label">Expiry</label>
                                <input className="input font-mono" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d/]/g, '').slice(0, 5))} placeholder="MM/YY" maxLength={5} />
                              </div>
                              <div>
                                <label className="label">CVV</label>
                                <input className="input font-mono" type="password" value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="•••" inputMode="numeric" />
                              </div>
                              <p className="mt-1 text-xs text-ink-400 sm:col-span-2">This is a demo checkout — no real payment is processed. Do not enter real card details.</p>
                            </div>
                          )}
                          {m.id === 'upi' && (
                            <div>
                              <label className="label">UPI ID</label>
                              <input className="input" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" />
                            </div>
                          )}
                          {m.id === 'netbanking' && (
                            <div>
                              <label className="label">Select bank</label>
                              <select className="input" value={netBank} onChange={(e) => setNetBank(e.target.value)}>
                                {NETBANKS.map((b) => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <label className="label">Order remarks (optional)</label>
                  <textarea className="input min-h-[72px] resize-none" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Leave at the door if I'm not home" />
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button className="btn-ghost" onClick={() => setStep(1)}><IconBack className="h-4 w-4" /> Back</button>
                  <button className="btn-primary" onClick={() => gotoStep(3)}>
                    Review order <IconChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="card overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                  <IconCheck className="h-5 w-5 text-emerald-500" />
                  Review Your Order
                </h2>
              </div>
              <div className="p-5">
                {/* Address */}
                <div className="rounded-2xl bg-ink-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Deliver to</p>
                    <button onClick={() => setStep(1)} className="link-brand text-xs font-semibold">Edit</button>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink-900">{selectedAddr?.full_name} · {selectedAddr?.phone}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{selectedAddr?.house}, {selectedAddr?.city}, {selectedAddr?.state} — {selectedAddr?.pin_code}, {selectedAddr?.country}</p>
                </div>

                {/* Payment */}
                <div className="mt-3 rounded-2xl bg-ink-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Payment</p>
                    <button onClick={() => setStep(2)} className="link-brand text-xs font-semibold">Edit</button>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink-900">{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {paymentMethod === 'upi' ? upiId : paymentMethod === 'card' ? `•••• ${cardNumber.replace(/\s/g, '').slice(-4)}` : paymentMethod === 'netbanking' ? netBank : 'Pay on delivery'}
                  </p>
                </div>

                {/* Items */}
                <div className="mt-3 divide-y divide-ink-100 rounded-2xl border border-ink-100">
                  {checkout.items.map((item) => (
                    <div key={`${item.product_id}-${item.variant_id}`} className="flex items-center gap-3 p-3">
                      <img src={item.image || ''} alt="" className="h-14 w-14 rounded-xl bg-ink-100 object-cover" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-800">{item.name}</p>
                        {item.variant_name && <p className="text-xs text-ink-500">{item.variant_name}</p>}
                        <p className="text-xs text-ink-400">Qty {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-ink-900">{formatPrice(item.total)}</p>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="mt-4 space-y-2 rounded-2xl border border-ink-100 p-4 text-sm">
                  <PriceRow label="Item total" value={formatPrice(checkout.subtotal)} />
                  {checkout.discount > 0 && (
                    <PriceRow label={`Discount${checkout.coupon ? ` (${checkout.coupon.code})` : ''}`} value={`− ${formatPrice(checkout.discount)}`} className="text-emerald-600" />
                  )}
                  <PriceRow label="Delivery" value={checkout.deliveryFee === 0 ? 'FREE' : formatPrice(checkout.deliveryFee)} className={checkout.deliveryFee === 0 ? 'text-emerald-600' : ''} />
                  <PriceRow label="Tax" value={formatPrice(checkout.tax)} />
                  <div className="flex items-center justify-between border-t border-ink-100 pt-3">
                    <span className="font-bold text-ink-900">Total</span>
                    <span className="text-lg font-extrabold text-ink-900">{formatPrice(checkout.total)}</span>
                  </div>
                </div>

                {remarks.trim() && (
                  <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-semibold">Remarks</p>
                    <p className="mt-0.5">{remarks}</p>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <button className="btn-ghost" onClick={() => setStep(2)}><IconBack className="h-4 w-4" /> Back</button>
                  <button className="btn-accent px-6" onClick={placeOrder} disabled={placing}>
                    {placing ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Placing order…
                      </>
                    ) : (
                      <>Place Order · {formatPrice(checkout.total)}</>
                    )}
                  </button>
                </div>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
                  <IconLock className="h-3.5 w-3.5" /> Secure checkout · your details are protected
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Summary sidebar */}
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-5">
            <h3 className="text-sm font-bold text-ink-900">Order Summary</h3>
            <div className="mt-3 space-y-2 text-sm">
              {checkout.items.slice(0, 4).map((item) => (
                <div key={`${item.product_id}-${item.variant_id}`} className="flex items-center gap-2.5">
                  <img src={item.image || ''} alt="" className="h-10 w-10 rounded-lg bg-ink-100 object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink-700">{item.name}</p>
                    <p className="text-xs text-ink-400">Qty {item.quantity}</p>
                  </div>
                  <span className="text-xs font-semibold text-ink-700">{formatPrice(item.total)}</span>
                </div>
              ))}
              {checkout.items.length > 4 && (
                <p className="text-xs text-ink-400">+{checkout.items.length - 4} more items</p>
              )}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-3 text-sm">
              <PriceRow label="Subtotal" value={formatPrice(checkout.subtotal)} small />
              {checkout.discount > 0 && <PriceRow label="Discount" value={`− ${formatPrice(checkout.discount)}`} small className="text-emerald-600" />}
              <PriceRow label="Delivery" value={checkout.deliveryFee === 0 ? 'FREE' : formatPrice(checkout.deliveryFee)} small className={checkout.deliveryFee === 0 ? 'text-emerald-600' : ''} />
              <PriceRow label="Tax" value={formatPrice(checkout.tax)} small />
              <div className="flex items-center justify-between border-t border-ink-100 pt-2">
                <span className="font-bold text-ink-900">Total</span>
                <span className="text-lg font-extrabold text-ink-900">{formatPrice(checkout.total)}</span>
              </div>
            </div>
            {checkout.free_delivery_threshold > 0 && checkout.deliveryFee > 0 && (
              <p className="mt-3 rounded-xl bg-brand-50 p-2.5 text-xs text-brand-700">
                Add {formatPrice(checkout.free_delivery_threshold - checkout.subtotal)} more to get FREE delivery
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function PriceRow({ label, value, className = '', small }: { label: string; value: string; className?: string; small?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={small ? 'text-xs text-ink-500' : 'text-sm text-ink-500'}>{label}</span>
      <span className={`${small ? 'text-xs' : 'text-sm'} font-semibold text-ink-800 ${className}`}>{value}</span>
    </div>
  )
}
