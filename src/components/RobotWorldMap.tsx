import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface RobotLocation {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  status: 'healthy' | 'warning' | 'critical';
  activeRobots: number;
  totalRobots: number;
  alerts: number;
  uptime: number;
  country?: string;
  region?: string;
  robotStatusCounts: { healthy: number; warning: number; critical: number };
}

interface RobotWorldMapProps {
  locations: RobotLocation[];
  autoRefresh?: boolean;
  onRegionChange?: (region: string | null) => void;
  onCountryChange?: (country: string | null) => void;
}

const RobotWorldMap: React.FC<RobotWorldMapProps> = ({ locations, onRegionChange, onCountryChange }) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedView, setSelectedView] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [highlightedRegion, setHighlightedRegion] = useState<string | null>(null);
  const [highlightedCountry, setHighlightedCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Aggregate data by country
  const countryData = useMemo(() => {
    const byCountry: Record<string, {
      country: string;
      region: string;
      totalRobots: number;
      activeRobots: number;
      alerts: number;
      locations: string[];
      avgUptime: number;
    }> = {};
    
    locations.forEach(loc => {
      if (!loc.country) return;
      
      if (!byCountry[loc.country]) {
        byCountry[loc.country] = {
          country: loc.country,
          region: loc.region || 'Unknown',
          totalRobots: 0,
          activeRobots: 0,
          alerts: 0,
          locations: [],
          avgUptime: 0,
        };
      }
      
      byCountry[loc.country].totalRobots += loc.totalRobots;
      byCountry[loc.country].activeRobots += loc.activeRobots;
      byCountry[loc.country].alerts += loc.alerts;
      byCountry[loc.country].locations.push(loc.name);
      byCountry[loc.country].avgUptime += loc.uptime;
    });
    
    // Calculate average uptime
    Object.values(byCountry).forEach(country => {
      const locationCount = country.locations.length;
      if (locationCount > 0) {
        country.avgUptime = country.avgUptime / locationCount;
      }
    });
    
    return byCountry;
  }, [locations]);

  // Create region to countries mapping
  const regionToCountries = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    locations.forEach(loc => {
      if (loc.region && loc.country) {
        if (!mapping[loc.region]) {
          mapping[loc.region] = [];
        }
        if (!mapping[loc.region].includes(loc.country)) {
          mapping[loc.region].push(loc.country);
        }
      }
    });
    return mapping;
  }, [locations]);

  // Debug: Log locations and country data
  console.log('RobotWorldMap - Locations:', locations);
  console.log('RobotWorldMap - Country Data:', countryData);

  // Map country names to ISO codes for geography matching
  const countryNameToIso: Record<string, string> = {
    'India': 'IND',
    'USA': 'USA',
    'United States': 'USA',
    'United States of America': 'USA',
    'China': 'CHN',
    'UK': 'GBR',
    'United Kingdom': 'GBR',
    'Germany': 'DEU',
    'France': 'FRA',
    'Spain': 'ESP',
    'Italy': 'ITA',
    'Netherlands': 'NLD',
    'Switzerland': 'CHE',
    'Sweden': 'SWE',
    'Poland': 'POL',
    'Japan': 'JPN',
    'Singapore': 'SGP',
    'South Korea': 'KOR',
    'Korea': 'KOR',
    'Thailand': 'THA',
    'Malaysia': 'MYS',
    'Indonesia': 'IDN',
    'Vietnam': 'VNM',
    'Philippines': 'PHL',
    'UAE': 'ARE',
    'United Arab Emirates': 'ARE',
  };

  // Reverse mapping: ISO to primary country name from our data
  const isoToCountryName: Record<string, string> = {
    'IND': 'India',
    'USA': 'United States',
    'CHN': 'China',
    'GBR': 'United Kingdom',
    'DEU': 'Germany',
    'FRA': 'France',
    'ESP': 'Spain',
    'ITA': 'Italy',
    'NLD': 'Netherlands',
    'CHE': 'Switzerland',
    'SWE': 'Sweden',
    'POL': 'Poland',
    'JPN': 'Japan',
    'SGP': 'Singapore',
    'KOR': 'South Korea',
    'THA': 'Thailand',
    'MYS': 'Malaysia',
    'IDN': 'Indonesia',
    'VNM': 'Vietnam',
    'PHL': 'Philippines',
    'ARE': 'UAE',
  };

  const getCountryColor = (countryName: string) => {
    const data = countryData[countryName];
    if (!data) return null;
    
    // Color based on robot density - more robots = darker color
    const intensity = Math.min(data.totalRobots / 50, 1); // Cap at 50 robots for max intensity
    const baseColor = '#3b82f6'; // Blue
    return baseColor;
  };

  const getCountryStatus = (countryName: string): 'healthy' | 'warning' | 'critical' => {
    const data = countryData[countryName];
    if (!data) return 'healthy';
    
    const activePercentage = (data.activeRobots / data.totalRobots) * 100;
    if (activePercentage >= 80 && data.alerts === 0) return 'healthy';
    if (activePercentage >= 60 || data.alerts <= 2) return 'warning';
    return 'critical';
  };

  const getCountryOpacity = (countryName: string) => {
    const data = countryData[countryName];
    if (!data) return 0;
    
    // Opacity based on robot count (0.3 to 0.8)
    return 0.3 + (Math.min(data.totalRobots / 50, 1) * 0.5);
  };

  const handleCountryMouseEnter = (geo: any, event: React.MouseEvent) => {
    const geoCountryName = geo.properties?.name || '';
    const geoIso = geo.id;
    
    // Find matching country from our data using same logic as rendering
    const matchedCountry = Object.keys(countryData).find(dataCountry => {
      if (dataCountry === geoCountryName) return true;
      if (countryNameToIso[dataCountry] === geoIso) return true;
      if (countryNameToIso[geoCountryName] && 
          countryNameToIso[geoCountryName] === countryNameToIso[dataCountry]) return true;
      return false;
    });
    
    if (matchedCountry && countryData[matchedCountry]) {
      setHoveredCountry(matchedCountry);
      setTooltipPosition({
        x: event.clientX,
        y: event.clientY - 10
      });
    }
  };

  const handleCountryMouseLeave = () => {
    setHoveredCountry(null);
  };

  // Calculate summary statistics
  const stats = useMemo(() => {
    const byRegion: Record<string, { total: number; active: number; alerts: number; status: Record<string, number> }> = {};
    const byCountry: Record<string, { region: string; total: number; active: number; alerts: number; status: Record<string, number> }> = {};
    const byStatus = { healthy: 0, warning: 0, critical: 0 };
    
    locations.forEach(loc => {
      // Count robots by status (not locations)
      byStatus.healthy += loc.robotStatusCounts.healthy;
      byStatus.warning += loc.robotStatusCounts.warning;
      byStatus.critical += loc.robotStatusCounts.critical;
      
      // By region
      if (loc.region) {
        if (!byRegion[loc.region]) {
          byRegion[loc.region] = { total: 0, active: 0, alerts: 0, status: { healthy: 0, warning: 0, critical: 0 } };
        }
        byRegion[loc.region].total += loc.totalRobots;
        byRegion[loc.region].active += loc.activeRobots;
        byRegion[loc.region].alerts += loc.alerts;
        byRegion[loc.region].status.healthy += loc.robotStatusCounts.healthy;
        byRegion[loc.region].status.warning += loc.robotStatusCounts.warning;
        byRegion[loc.region].status.critical += loc.robotStatusCounts.critical;
      }
      
      // By country
      if (loc.country) {
        if (!byCountry[loc.country]) {
          byCountry[loc.country] = { region: loc.region || 'Unknown', total: 0, active: 0, alerts: 0, status: { healthy: 0, warning: 0, critical: 0 } };
        }
        byCountry[loc.country].total += loc.totalRobots;
        byCountry[loc.country].active += loc.activeRobots;
        byCountry[loc.country].alerts += loc.alerts;
        byCountry[loc.country].status.healthy += loc.robotStatusCounts.healthy;
        byCountry[loc.country].status.warning += loc.robotStatusCounts.warning;
        byCountry[loc.country].status.critical += loc.robotStatusCounts.critical;
      }
    });
    
    return {
      byRegion: Object.entries(byRegion).map(([region, data]) => ({ region, ...data })),
      byCountry: Object.entries(byCountry).map(([country, data]) => ({ country, ...data })),
      byStatus,
      totalLocations: locations.length,
      totalRobots: locations.reduce((sum, loc) => sum + loc.totalRobots, 0),
      totalActive: locations.reduce((sum, loc) => sum + loc.activeRobots, 0),
      totalAlerts: locations.reduce((sum, loc) => sum + loc.alerts, 0),
    };
  }, [locations]);

  // Filter locations based on selected view
  const filteredLocations = useMemo(() => {
    if (selectedView === 'all') return locations;
    return locations.filter(loc => loc.status === selectedView);
  }, [locations, selectedView]);

  // Color mapping based on status
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#10b981'; // Green
      case 'warning':
        return '#f59e0b'; // Orange
      case 'critical':
        return '#ef4444'; // Red
      default:
        return '#3b82f6'; // Blue
    }
  };

  return (
    <Card className="p-4 card-gradient border-border relative">
      <div className="mb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-base sm:text-lg">🌍 Global Robot Deployment Map</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedView === 'all' ? 'default' : 'outline'} 
              className="cursor-pointer"
              onClick={() => setSelectedView('all')}
            >
              All ({stats.totalRobots})
            </Badge>
            <Badge 
              variant={selectedView === 'healthy' ? 'default' : 'outline'}
              className="cursor-pointer bg-[#10b981] hover:bg-[#059669]"
              onClick={() => setSelectedView('healthy')}
            >
              Healthy ({stats.byStatus.healthy})
            </Badge>
            <Badge 
              variant={selectedView === 'warning' ? 'default' : 'outline'}
              className="cursor-pointer bg-[#f59e0b] hover:bg-[#d97706]"
              onClick={() => setSelectedView('warning')}
            >
              Warning ({stats.byStatus.warning})
            </Badge>
            <Badge 
              variant={selectedView === 'critical' ? 'default' : 'outline'}
              className="cursor-pointer bg-[#ef4444] hover:bg-[#dc2626]"
              onClick={() => setSelectedView('critical')}
            >
              Critical ({stats.byStatus.critical})
            </Badge>
          </div>
        </div>
      </div>

      {/* Statistics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* By Region */}
        <Card className="p-3 bg-muted/50">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span>🌐</span> By Region
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.byRegion.map(({ region, total, active, alerts, status }) => (
              <div 
                key={region} 
                className={`flex justify-between items-center text-xs p-2 rounded cursor-pointer transition-all ${
                  highlightedRegion === region ? 'bg-[#f59e0b]/20 ring-2 ring-[#f59e0b]' : 'bg-card/50 hover:bg-card'
                }`}
                onClick={() => {
                  if (highlightedRegion === region) {
                    setHighlightedRegion(null);
                    setSelectedCountry(null);
                    onRegionChange?.(null);
                    onCountryChange?.(null);
                  } else {
                    setHighlightedRegion(region);
                    setSelectedCountry(null);
                    onRegionChange?.(region);
                    onCountryChange?.(null);
                  }
                }}
              >
                <div className="flex-1">
                  <div className="font-medium">{region}</div>
                  <div className="text-muted-foreground">
                    {active}/{total} robots • {alerts} alerts
                  </div>
                </div>
                <div className="flex gap-1">
                  {status.healthy > 0 && (
                    <Badge variant="outline" className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">
                      {status.healthy}
                    </Badge>
                  )}
                  {status.warning > 0 && (
                    <Badge variant="outline" className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20">
                      {status.warning}
                    </Badge>
                  )}
                  {status.critical > 0 && (
                    <Badge variant="outline" className="bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20">
                      {status.critical}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* By Country */}
        <Card className="p-3 bg-muted/50">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span>🏳️</span> By Country
            {highlightedRegion && (
              <Badge variant="outline" className="ml-auto text-xs">
                {highlightedRegion}
              </Badge>
            )}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {highlightedRegion ? (
              // Filter countries by selected region
              stats.byCountry.filter(({ region }) => region === highlightedRegion).length > 0 ? (
                stats.byCountry
                  .filter(({ region }) => region === highlightedRegion)
                  .map(({ country, total, active, alerts, status }) => (
                    <div 
                      key={country} 
                      className={`flex justify-between items-center text-xs p-2 rounded cursor-pointer transition-all ${
                        selectedCountry === country ? 'bg-[#f59e0b]/20 ring-2 ring-[#f59e0b]' : 
                        highlightedCountry === country ? 'bg-[#f59e0b]/10 ring-1 ring-[#f59e0b]/50' : 
                        'bg-card/50 hover:bg-card'
                      }`}
                      onMouseEnter={() => setHighlightedCountry(country)}
                      onMouseLeave={() => setHighlightedCountry(null)}
                      onClick={() => {
                        setSelectedCountry(selectedCountry === country ? null : country);
                        onCountryChange?.(selectedCountry === country ? null : country);
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{country}</div>
                        <div className="text-muted-foreground">
                          {active}/{total} robots • {alerts} alerts
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {status.healthy > 0 && (
                          <Badge variant="outline" className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">
                            {status.healthy}
                          </Badge>
                        )}
                        {status.warning > 0 && (
                          <Badge variant="outline" className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20">
                            {status.warning}
                          </Badge>
                        )}
                        {status.critical > 0 && (
                          <Badge variant="outline" className="bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20">
                            {status.critical}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No countries in this region
                </div>
              )
            ) : (
              // Show all countries when no region is selected
              stats.byCountry.map(({ country, total, active, alerts, status }) => (
                <div 
                  key={country} 
                  className={`flex justify-between items-center text-xs p-2 rounded cursor-pointer transition-all ${
                    selectedCountry === country ? 'bg-[#f59e0b]/20 ring-2 ring-[#f59e0b]' : 
                    highlightedCountry === country ? 'bg-[#f59e0b]/10 ring-1 ring-[#f59e0b]/50' : 
                    'bg-card/50 hover:bg-card'
                  }`}
                  onMouseEnter={() => setHighlightedCountry(country)}
                  onMouseLeave={() => setHighlightedCountry(null)}
                  onClick={() => {
                    setSelectedCountry(selectedCountry === country ? null : country);
                    onCountryChange?.(selectedCountry === country ? null : country);
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium">{country}</div>
                    <div className="text-muted-foreground">
                      {active}/{total} robots • {alerts} alerts
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {status.healthy > 0 && (
                      <Badge variant="outline" className="bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20">
                        {status.healthy}
                      </Badge>
                    )}
                    {status.warning > 0 && (
                      <Badge variant="outline" className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20">
                        {status.warning}
                      </Badge>
                    )}
                    {status.critical > 0 && (
                      <Badge variant="outline" className="bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20">
                        {status.critical}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="relative bg-slate-900 rounded-lg overflow-hidden" style={{ width: '100%', height: '600px' }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 147,
            center: [0, 20]
          }}
          width={980}
          height={551}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={1}
            center={[0, 20]}
            minZoom={1}
            maxZoom={8}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) => {
                if (geographies.length > 0 && !geographies[0]._logged) {
                  console.log('Sample geography:', geographies[0]);
                  geographies[0]._logged = true;
                }
                return geographies.map((geo) => {
                  const geoCountryName = geo.properties?.name || '';
                  const geoIso = geo.id;
                  
                  // Find matching country from our data
                  // Try: 1) Direct match, 2) ISO match, 3) Reverse ISO lookup
                  let matchedCountry = Object.keys(countryData).find(dataCountry => {
                    // Direct name match
                    if (dataCountry === geoCountryName) return true;
                    // Data country ISO matches geo ISO
                    if (countryNameToIso[dataCountry] === geoIso) return true;
                    // Geo name matches data country's ISO
                    if (countryNameToIso[geoCountryName] && 
                        countryNameToIso[geoCountryName] === countryNameToIso[dataCountry]) return true;
                    return false;
                  });
                  
                  const hasData = matchedCountry && countryData[matchedCountry];
                  const isHovered = matchedCountry === hoveredCountry;
                  
                  // Check if this country should be highlighted
                  // Priority: Selected country > Hovered country > Region selection
                  const isSelectedCountry = selectedCountry === matchedCountry;
                  const isHighlightedByCountry = highlightedCountry === matchedCountry;
                  const isHighlightedByRegion = !selectedCountry && !highlightedCountry && highlightedRegion && matchedCountry && 
                    regionToCountries[highlightedRegion]?.includes(matchedCountry);
                  const isHighlighted = isSelectedCountry || isHighlightedByCountry || isHighlightedByRegion;
                  
                  if (hasData && countryData[matchedCountry].totalRobots > 0) {
                    console.log('✓ Matched:', geoCountryName, '→', matchedCountry, 
                                `(${countryData[matchedCountry].totalRobots} robots)`);
                  }
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={hasData ? (isHighlighted ? '#f59e0b' : '#3b82f6') : '#2d3748'}
                      stroke={isHovered || isHighlighted ? '#f59e0b' : '#4a5568'}
                      strokeWidth={isHovered || isHighlighted ? 3 : 1}
                      style={{
                        default: {
                          fill: hasData ? (isHighlighted ? '#f59e0b' : '#3b82f6') : '#2d3748',
                          stroke: isHighlighted ? '#f59e0b' : '#4a5568',
                          strokeWidth: isHighlighted ? 3 : 1,
                          outline: 'none',
                          opacity: hasData ? (isHighlighted ? 0.9 : getCountryOpacity(matchedCountry!)) : 0.6,
                        },
                        hover: {
                          fill: hasData ? '#60a5fa' : '#3d4d60',
                          stroke: '#60a5fa',
                          strokeWidth: 2,
                          outline: 'none',
                          cursor: hasData ? 'pointer' : 'default',
                          opacity: hasData ? Math.min(getCountryOpacity(matchedCountry!) + 0.2, 1) : 0.7,
                        },
                        pressed: {
                          fill: hasData ? '#60a5fa' : '#3d4d60',
                          stroke: '#60a5fa',
                          strokeWidth: 2,
                          outline: 'none',
                          opacity: hasData ? 0.9 : 0.7,
                        },
                      }}
                      onMouseEnter={(e) => hasData && handleCountryMouseEnter(geo, e)}
                      onMouseMove={(e) => hasData && handleCountryMouseEnter(geo, e)}
                      onMouseLeave={handleCountryMouseLeave}
                      onClick={() => {
                        if (hasData && matchedCountry) {
                          const newCountry = selectedCountry === matchedCountry ? null : matchedCountry;
                          setSelectedCountry(newCountry);
                          onCountryChange?.(newCountry);
                        }
                      }}
                    />
                  );
                });
              }}
            </Geographies>

            {/* No individual markers needed */}
            {filteredLocations.length === 0 && (
              <text
                x="400"
                y="200"
                textAnchor="middle"
                style={{
                  fontFamily: 'system-ui',
                  fontSize: '16px',
                  fill: '#ffffff',
                }}
              >
                No robot locations available
              </text>
            )}
          </ZoomableGroup>
        </ComposableMap>

        {/* Country Tooltip */}
        {hoveredCountry && tooltipPosition && countryData[hoveredCountry] && (
          <div
            className="absolute z-50 bg-card border border-border rounded-lg shadow-lg p-3 pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)',
              minWidth: '280px',
            }}
          >
            <div className="space-y-1">
              {/* Country Header */}
              <div className="font-semibold text-sm border-b border-border pb-1">
                {hoveredCountry}
              </div>
              
              {/* Deployment Stats */}
              <div className="text-xs space-y-1">
                {countryData[hoveredCountry].region && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Region:</span>
                    <span className="font-medium">{countryData[hoveredCountry].region}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span
                    className="font-medium capitalize"
                    style={{ color: getMarkerColor(getCountryStatus(hoveredCountry)) }}
                  >
                    {getCountryStatus(hoveredCountry)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Robots:</span>
                  <span className="font-medium">
                    {countryData[hoveredCountry].activeRobots} / {countryData[hoveredCountry].totalRobots}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Uptime:</span>
                  <span className="font-medium">{countryData[hoveredCountry].avgUptime.toFixed(1)}%</span>
                </div>
                {countryData[hoveredCountry].alerts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alerts:</span>
                    <span className="font-medium text-red-500">{countryData[hoveredCountry].alerts}</span>
                  </div>
                )}
                
                {/* Locations List */}
                <div className="pt-1 mt-1 border-t border-border">
                  <div className="text-muted-foreground mb-0.5">
                    Locations ({countryData[hoveredCountry].locations.length}):
                  </div>
                  <div className="font-medium text-foreground max-h-20 overflow-y-auto text-xs">
                    {countryData[hoveredCountry].locations.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* Simple hover effect - no glowing */
      `}</style>
    </Card>
  );
};

export default RobotWorldMap;
