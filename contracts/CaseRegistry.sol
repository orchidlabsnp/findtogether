// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CaseRegistry is AccessControl, Pausable {
    using Counters for Counters.Counter;

    // Constants and roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    Counters.Counter private _caseIdCounter;

    // Optimized enums
    enum Status { Open, Investigating, Resolved }
    enum CaseType { Missing, Labour, Harassment }

    // Optimized core data structure
    struct CaseCore {
        bytes32 childName;        // Fixed length for common fields
        uint8 age;               // Reduced from uint256
        bytes32 location;        // Fixed length for common fields
        Status status;
        CaseType caseType;
        address reporter;
        uint40 timestamp;        // Reduced from uint256, supports dates until year 2078
    }

    // Optional details structure
    struct CaseDetails {
        string description;      // Variable length, less frequently accessed
        string contactInfo;
        string imageUrl;
        string aiAnalysis;      // Store AI analysis results
        bytes32 physicalTraits; // Packed physical characteristics
    }

    // Optimized storage layout
    mapping(uint256 => CaseCore) private _casesCore;
    mapping(uint256 => CaseDetails) private _casesDetails;
    mapping(address => uint256[]) private _userCases;

    // Events for off-chain indexing
    event CaseSubmitted(
        uint256 indexed caseId,
        bytes32 indexed childName,
        address indexed reporter,
        uint40 timestamp
    );

    event CaseStatusUpdated(
        uint256 indexed caseId,
        Status newStatus,
        address indexed updatedBy,
        uint40 timestamp
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Optimized input structure
    struct CaseInput {
        string childName;
        uint8 age;
        string location;
        string description;
        string contactInfo;
        CaseType caseType;
        string imageUrl;
        string physicalTraits;
    }

    // Gas-optimized validation
    modifier validCase(uint256 caseId) {
        require(_casesCore[caseId].timestamp != 0, "Case not found");
        _;
    }

    // Optimized case submission
    function submitCase(CaseInput calldata input) 
        external 
        whenNotPaused 
        returns (uint256) 
    {
        // Input validation
        require(bytes(input.childName).length > 0 && bytes(input.childName).length <= 32, "Invalid name");
        require(input.age > 0 && input.age < 18, "Invalid age");
        require(bytes(input.location).length > 0 && bytes(input.location).length <= 32, "Invalid location");

        // Increment counter in unchecked block
        uint256 newCaseId;
        unchecked {
            _caseIdCounter.increment();
            newCaseId = _caseIdCounter.current();
        }

        // Store core data
        _casesCore[newCaseId] = CaseCore({
            childName: bytes32(bytes(input.childName)),
            age: input.age,
            location: bytes32(bytes(input.location)),
            status: Status.Open,
            caseType: input.caseType,
            reporter: msg.sender,
            timestamp: uint40(block.timestamp)
        });

        // Store details separately
        _casesDetails[newCaseId] = CaseDetails({
            description: input.description,
            contactInfo: input.contactInfo,
            imageUrl: input.imageUrl,
            aiAnalysis: "",
            physicalTraits: bytes32(bytes(input.physicalTraits))
        });

        // Track user cases
        _userCases[msg.sender].push(newCaseId);

        // Emit event
        emit CaseSubmitted(
            newCaseId,
            _casesCore[newCaseId].childName,
            msg.sender,
            uint40(block.timestamp)
        );

        return newCaseId;
    }

    // Optimized status update
    function updateCaseStatus(uint256 caseId, Status newStatus)
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
        validCase(caseId)
    {
        require(uint8(newStatus) <= uint8(Status.Resolved), "Invalid status");

        _casesCore[caseId].status = newStatus;

        emit CaseStatusUpdated(
            caseId,
            newStatus,
            msg.sender,
            uint40(block.timestamp)
        );
    }

    // Batch status update for gas optimization
    function batchUpdateStatus(uint256[] calldata caseIds, Status newStatus)
        external
        onlyRole(ADMIN_ROLE)
        whenNotPaused
    {
        require(uint8(newStatus) <= uint8(Status.Resolved), "Invalid status");

        uint256 length = caseIds.length;
        for (uint256 i = 0; i < length;) {
            require(_casesCore[caseIds[i]].timestamp != 0, "Case not found");
            _casesCore[caseIds[i]].status = newStatus;

            emit CaseStatusUpdated(
                caseIds[i],
                newStatus,
                msg.sender,
                uint40(block.timestamp)
            );

            unchecked { ++i; }
        }
    }

    // View functions with gas optimization
    function getCaseCore(uint256 caseId)
        external
        view
        validCase(caseId)
        returns (CaseCore memory)
    {
        return _casesCore[caseId];
    }

    function getCaseDetails(uint256 caseId)
        external
        view
        validCase(caseId)
        returns (CaseDetails memory)
    {
        return _casesDetails[caseId];
    }

    function getUserCases(address user)
        external
        view
        returns (uint256[] memory)
    {
        return _userCases[user];
    }

    // Administrative functions
    function setAiAnalysis(uint256 caseId, string calldata analysis)
        external
        onlyRole(ADMIN_ROLE)
        validCase(caseId)
    {
        _casesDetails[caseId].aiAnalysis = analysis;
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}