import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plus, Edit, Trash2, DollarSign, TrendingUp, Package, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getActiveListings, updateListing, deleteListing, type ListingWithCoin } from "@/services/listingService";
import { ImageViewer } from "@/components/ImageViewer";
import { getUserCoins } from "@/services/userCoinService";
import { createSale } from "@/services/userSalesService";
import type { Coin } from "@/types/coin";

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingWithCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit listing dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<ListingWithCoin | null>(null);
  const [editFormData, setEditFormData] = useState({
    platform: "",
    startingPrice: "",
    currentBid: "",
    expectedEndDate: "",
    notes: ""
  });
  
  // Complete sale dialog
  const [isCompleteSaleDialogOpen, setIsCompleteSaleDialogOpen] = useState(false);
  const [completingListing, setCompletingListing] = useState<ListingWithCoin | null>(null);
  const [completeSaleData, setCompleteSaleData] = useState({
    salePrice: "",
    buyerInfo: "",
    saleDate: new Date().toISOString().split("T")[0],
    notes: ""
  });

  useEffect(() => {
    loadListings();
  }, []);

  async function loadListings() {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await getActiveListings();
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setListings(data);
    }
    setLoading(false);
  }

  function openEditDialog(listing: ListingWithCoin) {
    setEditingListing(listing);
    setEditFormData({
      platform: listing.platform,
      startingPrice: listing.starting_price.toString(),
      currentBid: listing.current_bid?.toString() || "",
      expectedEndDate: listing.expected_end_date || "",
      notes: listing.notes || ""
    });
    setIsEditDialogOpen(true);
  }

  async function handleUpdateListing() {
    if (!editingListing) return;

    const updates = {
      platform: editFormData.platform,
      startingPrice: parseFloat(editFormData.startingPrice),
      currentBid: editFormData.currentBid ? parseFloat(editFormData.currentBid) : undefined,
      expectedEndDate: editFormData.expectedEndDate || undefined,
      notes: editFormData.notes || undefined
    };

    const { error: updateError } = await updateListing(editingListing.id, updates);
    if (updateError) {
      setError(updateError.message);
    } else {
      setIsEditDialogOpen(false);
      loadListings();
    }
  }

  async function handleDeleteListing(listingId: string, coinId: string) {
    if (!confirm("Are you sure you want to remove this listing? The coin will return to your collection.")) {
      return;
    }

    const { error: deleteError } = await deleteListing(listingId, coinId);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      loadListings();
    }
  }

  function openCompleteSaleDialog(listing: ListingWithCoin) {
    setCompletingListing(listing);
    const highestPrice = Math.max(listing.starting_price, listing.current_bid || 0);
    setCompleteSaleData({
      salePrice: highestPrice.toString(),
      buyerInfo: "",
      saleDate: new Date().toISOString().split("T")[0],
      notes: listing.notes || ""
    });
    setIsCompleteSaleDialogOpen(true);
  }

  async function handleCompleteSale() {
    if (!completingListing || !completingListing.coin) return;

    const salePrice = parseFloat(completeSaleData.salePrice);
    const purchasePrice = completingListing.coin.purchasePrice;
    const profit = salePrice - purchasePrice;

    const saleData = {
      coinId: completingListing.coin_id,
      sku: completingListing.coin.sku,
      coinName: completingListing.coin.coinName,
      saleDate: completeSaleData.saleDate,
      salePrice,
      purchasePrice,
      profit,
      buyerInfo: completeSaleData.buyerInfo,
      notes: completeSaleData.notes
    };

    const { error: saleError } = await createSale(saleData);
    if (saleError) {
      setError(saleError.message);
      return;
    }

    // Delete the listing
    const { error: deleteError } = await deleteListing(completingListing.id, completingListing.coin_id);
    if (deleteError) {
      setError(deleteError.message);
    } else {
      setIsCompleteSaleDialogOpen(false);
      loadListings();
    }
  }

  const totalPurchaseValue = listings.reduce((sum, listing) => sum + (listing.coin?.purchasePrice || 0), 0);
  const totalListingValue = listings.reduce((sum, listing) => {
    const highestPrice = Math.max(listing.starting_price, listing.current_bid || 0);
    return sum + highestPrice;
  }, 0);
  const potentialProfit = totalListingValue - totalPurchaseValue;

  return (
    <Layout>
      <SEO
        title="Active Listings - NumiVault"
        description="Manage your active coin listings and track ongoing sales"
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Active Listings</h1>
            <p className="text-muted-foreground">Track your coins currently listed for sale</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{listings.length}</div>
              <p className="text-xs text-muted-foreground">Coins currently listed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchase Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">CHF {totalPurchaseValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total invested in listed coins</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listing Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">CHF {totalListingValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Current highest bids/prices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${potentialProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                CHF {potentialProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {potentialProfit >= 0 ? "Expected gain" : "Expected loss"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Active Listings</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any coins listed for sale yet.
              </p>
              <Button onClick={() => router.push("/collection")}>
                Go to Collection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const coin = listing.coin;
              if (!coin) return null;

              const highestPrice = Math.max(listing.starting_price, listing.current_bid || 0);
              const profit = highestPrice - coin.purchasePrice;
              const profitPercentage = ((profit / coin.purchasePrice) * 100).toFixed(1);
              const hasBid = listing.current_bid && listing.current_bid > listing.starting_price;

              return (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{coin.coinName}</CardTitle>
                        <CardDescription className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{coin.sku}</Badge>
                            <Badge variant="secondary">{coin.year}</Badge>
                          </div>
                          <div className="text-sm">{coin.metal} • {coin.sheldonGrade}</div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Coin Images */}
                    {(coin.obverseImageUrl || coin.reverseImageUrl) && (
                      <div className="flex gap-2">
                        {coin.obverseImageUrl && (
                          <ImageViewer
                            src={coin.obverseImageUrl}
                            alt={`${coin.coinName} obverse`}
                            className="w-20 h-20 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        )}
                        {coin.reverseImageUrl && (
                          <ImageViewer
                            src={coin.reverseImageUrl}
                            alt={`${coin.coinName} reverse`}
                            className="w-20 h-20 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        )}
                      </div>
                    )}

                    {/* Listing Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform:</span>
                        <span className="font-medium">{listing.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Starting Price:</span>
                        <span className="font-medium">CHF {listing.starting_price.toFixed(2)}</span>
                      </div>
                      {listing.current_bid && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Bid:</span>
                          <span className="font-bold text-primary">
                            CHF {listing.current_bid.toFixed(2)}
                            {hasBid && " 🔥"}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Purchase Price:</span>
                        <span>CHF {coin.purchasePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-muted-foreground">Potential Profit:</span>
                        <span className={`font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          CHF {profit.toFixed(2)} ({profitPercentage}%)
                        </span>
                      </div>
                      {listing.expected_end_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expected End:</span>
                          <span>{new Date(listing.expected_end_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {listing.notes && (
                      <div className="text-sm text-muted-foreground border-t pt-2">
                        <p className="font-medium mb-1">Notes:</p>
                        <p className="whitespace-pre-wrap">{listing.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => openCompleteSaleDialog(listing)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete Sale
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(listing)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteListing(listing.id, listing.coin_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Listing Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>Update listing information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-platform">Platform/Venue</Label>
              <Input
                id="edit-platform"
                value={editFormData.platform}
                onChange={(e) => setEditFormData({ ...editFormData, platform: e.target.value })}
                placeholder="e.g., eBay, Heritage Auctions"
              />
            </div>
            <div>
              <Label htmlFor="edit-starting-price">Starting Price (CHF)</Label>
              <Input
                id="edit-starting-price"
                type="number"
                step="0.01"
                value={editFormData.startingPrice}
                onChange={(e) => setEditFormData({ ...editFormData, startingPrice: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-current-bid">Current Bid (CHF)</Label>
              <Input
                id="edit-current-bid"
                type="number"
                step="0.01"
                value={editFormData.currentBid}
                onChange={(e) => setEditFormData({ ...editFormData, currentBid: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="edit-end-date">Expected End Date</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={editFormData.expectedEndDate}
                onChange={(e) => setEditFormData({ ...editFormData, expectedEndDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Additional information about this listing"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateListing}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Sale Dialog */}
      <Dialog open={isCompleteSaleDialogOpen} onOpenChange={setIsCompleteSaleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
            <DialogDescription>Record the final sale details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sale-price">Final Sale Price (CHF)</Label>
              <Input
                id="sale-price"
                type="number"
                step="0.01"
                value={completeSaleData.salePrice}
                onChange={(e) => setCompleteSaleData({ ...completeSaleData, salePrice: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="sale-date">Sale Date</Label>
              <Input
                id="sale-date"
                type="date"
                value={completeSaleData.saleDate}
                onChange={(e) => setCompleteSaleData({ ...completeSaleData, saleDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="buyer-info">Buyer Information</Label>
              <Input
                id="buyer-info"
                value={completeSaleData.buyerInfo}
                onChange={(e) => setCompleteSaleData({ ...completeSaleData, buyerInfo: e.target.value })}
                placeholder="Name, email, or identifier"
              />
            </div>
            <div>
              <Label htmlFor="sale-notes">Notes</Label>
              <Textarea
                id="sale-notes"
                value={completeSaleData.notes}
                onChange={(e) => setCompleteSaleData({ ...completeSaleData, notes: e.target.value })}
                placeholder="Additional sale details"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteSaleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteSale}>Complete Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}