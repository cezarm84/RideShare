"""
Debugging script to verify class exports from the ride module
"""
import inspect
import sys

def debug_module_exports():
    """Print all classes and functions exported by the ride module"""
    print("Debugging module exports...")
    
    try:
        # Import the module
        from app.schemas import ride
        
        # Get all classes and functions
        items = inspect.getmembers(ride)
        
        print("\nClasses in ride module:")
        for name, obj in items:
            if inspect.isclass(obj):
                print(f"- {name}")
        
        # Check specifically for the problematic class
        if hasattr(ride, 'RideDetailResponse'):
            print("\nRideDetailResponse exists")
        elif hasattr(ride, 'RideDetailedResponse'):
            print("\nRideDetailedResponse exists (but RideDetailResponse doesn't)")
        else:
            print("\nNeither RideDetailResponse nor RideDetailedResponse exists")
            
        # If we found RideDetailedResponse, suggest how to fix it
        if hasattr(ride, 'RideDetailedResponse'):
            print("\nTo fix the import error, use this in __init__.py:")
            print("from .ride import RideCreate, RideResponse, RideDetailedResponse as RideDetailResponse, RideBookingResponse, RideUpdate")
            
    except ImportError as e:
        print(f"Import error: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_module_exports()
    sys.exit(0)